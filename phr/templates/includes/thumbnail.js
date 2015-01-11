frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
// {% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}

var ThumbNails = function(){
	this.wrapper = ""
}

$.extend(ThumbNails.prototype,{
	init :function(wrapper, arg){
		this.wrapper = wrapper;
		this.args = arg;
		this.selected_files = []
		this.folder = arg['folder'];
		this.sub_folder = arg['sub_folder'];
		this.uploader_display = arg['display'] == 'initial'? 'none':'initial';
		this.render_uploader_and_files()
	},
	render_uploader_and_files:function(){
		var me = this;
		$('.uploader').empty();
		console.log(me.uploader_display)
		$(repl_str('<div class="uploader">\
			<h4> Uploaded Files </h4>\
			<div id="uploaded_file">\
			</div>\
			<hr><br>\
			<div style="display:%(uploader_display)s">\
				<h4> Uploaded Files </h4>\
				<div id="attach"> Attach </div>\
			</div>\
			<button id="share_data">Share Data</button></div>',{'uploader_display':me.uploader_display})).appendTo($('.field-area'))
		
		$('#share_data').click(function(){
			me.send_email();
		})
		
		this.show_attachments();

		upload.make({
			parent: $('#attach'),
			args:{'profile_id':'1420875549394-645191', 'folder':me.folder, 'sub_folder': me.sub_folder},
			callback:function(attachment, r) {
				// console.log("in attachment callback")
				me.render_uploader_and_files();
			}
		});
	},
	show_attachments:function(){
		var me = this;
		frappe.call({
			method:"phr.templates.pages.event.get_attachments",
			args:{'profile_id':'123456789', 'folder':me.folder, 'sub_folder': me.sub_folder},
			callback:function(r){
				me.create_attachement_renderer(r.message)
			}
		})
	},
	create_attachement_renderer: function(attachments){
		var me = this;
		this.table = $('<table></table>').appendTo('#uploaded_file');

		row = $('<tr>').appendTo(this.table)
		$.each(attachments, function(i, attachment){
			// console.log(i)
			if((i+1)%4 == 0){
				row = $('<tr>').appendTo(me.table)
			}
			attachment['display'] = me.args['display'];
			me.render_attachemnt(attachment, row)
		})
	},
	render_attachemnt:function(attachment, row){
		var me = this;
		console.log(me.args)
		if(attachment['type'] == 'pdf' || attachment['type'] == 'PDF'){
			$td = $(repl('<td style="width:200px;\
							height:200px;padding-right:20px;vertical-align:top;">\
						',attachment)).appendTo(row)
			thumbnail("/"+attachment['path']+"/"+attachment['file_name'], $td, attachment['file_name'], me.args['display'])
		}
		else if((/\.(gif|jpg|jpeg|tiff|png)$/i).test(attachment['file_name']) ){
			$('<td style="width:200px;height:200px;padding-right:20px;vertical-align:top;">')
				.html($(repl('<div>\
						<input type="checkbox" name="image" style="display:%(display)s" value="%(file_name)s" >\
					</div>\
					<img style="height:150px;" src="/%(path)s/%(file_name)s">\
					<br><label style="width: 150px;word-wrap: break-word;">%(file_name)s</label>',attachment))).appendTo(row)
		}

		$("input[type=checkbox]").on( "click", function(){
			if($(this).is(':checked')){
				me.selected_files.push($(this).val())
			}
		});

	
	},
	send_email:function(){
		var me = this;
		var uniqueNames = [];

		$.each(me.selected_files, function(i, el){
			if($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
		});

		frappe.call({
			method:"phr.templates.pages.event.send_shared_data",
			args:{'files': uniqueNames, 'profile_id':'1420875549394-645191', 'folder':me.folder, 'sub_folder': me.sub_folder},
			callback:function(r){
				frappe.msgprint("mail has been sent!!!")
			}
		})
	}
})