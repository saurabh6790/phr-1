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
		console.log('in thumbnail')
		console.log(arg)
		this.doc_list = arg['doc_list']
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
			<hr><br>\
			<h4> Description </h4>\
			<div class="form-group row" style="margin: 0px">\
				<label class="control-label small col-xs-4" style="padding-right: 0px;">Description</label>\
				<div class="col-xs-8">\
					<div class="control-input">\
						<textarea type="text" class="form-control" \
							placeholder="Description" name="attch_desc"\
							aria-describedby="basic-addon2"></textarea>\
					</div>\
				</div>\
			</div>\
			<button  id="convert_to_pdf"\
				aria-describedby="basic-addon2"> <i class="icon-upload"></i>\
				 Attach As Pdf </button>\
			',{'uploader_display':me.uploader_display})).appendTo($('.field-area'))
		
		$('#convert_to_pdf').click(function(){
			me.convert_txt_to_pdf($('[name="attch_desc"]').val())
		})

		this.show_attachments();

		upload.make({
			parent: $('#attach'),
			args:{'profile_id': me.args['profile_id'], 'folder':me.folder, 
				'sub_folder': me.sub_folder, 'event_id': $('input[name="entityid"]').val()},
			callback:function(attachment, r) {
				console.log([attachment, r])
				me.args['dms_file_list'].push(
					{
						"tag_id": me.folder.split('-')[1]+''+me.sub_folder.split('_')[1],
						"tag_name": me.folder.split('-')[0],
	            		"sub_tag_name": me.sub_folder.split('_')[0],
	            		"file_id": [
							attachment['file_name']
						],
	            		"file_location": [
	            			attachment['site_path'] +'/'+ me.args['profile_id'] + '/' +  $('input[name="entityid"]').val() + '/' + me.folder + '/' +  me.sub_folder + '/' + attachment['file_name']
						]
				})
				me.render_uploader_and_files();
			}
		});
	},
	convert_txt_to_pdf:function(desc){
		frappe.require("/assets/phr/js/jspdf.js");
		frappe.require("/assets/phr/js/libs/base64.js");
		frappe.require("/assets/phr/js/libs/sprintf.js");
		
		var doc = new jsPDF();
		console.log(this)
	},
	show_attachments:function(){
		var me = this;
		console.log( me.args['profile_id'], me.folder, me.sub_folder )
		frappe.call({
			method:"phr.templates.pages.event.get_attachments",
			args:{'profile_id': me.args['profile_id'], 'folder':me.folder, 
				'sub_folder': me.sub_folder, 'event_id': $('input[name="entityid"]').val()},
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
				me.doc_list.push( me.args['profile_id'] + '/' +  $('input[name="entityid"]').val() + '/' + me.folder + '/' +  me.sub_folder + '/' + $(this).val())
			}
		});

	
	}
})