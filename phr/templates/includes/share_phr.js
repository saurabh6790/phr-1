frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
// {% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}


SharePhr = function(){
	this.wrapper = '';
}

$.extend(SharePhr.prototype,{
	init:function(wrapper, args){
		console.log('test')
		this.wrapper = wrapper;
		this.args = args;
		$(this.wrapper).empty()
		$('.field-area').empty()
		var me = this;
		this.selected_files = args.selected_files
		this.doc_list = args.doc_list;
		RenderFormFields.prototype.init(this.wrapper, {'file_name':args['file_name'], 
			'values': args['values'], 'method': args['method']}, args['event_id'])

		$('<button id="share_data" class="btn btn-primary">Share Data</button></div>').appendTo($('.field-area'))
		$('<div class="event_section"></div>').appendTo($('.field-area'))
		$('#share_data').click(function(){
			me.send_email();
		})
		this.bind_controller()
		this.render_folder_section()
	 //  	me.bind_events()
	},
	bind_controller: function(){
		
	},
	render_folder_section:function(){
		var me = this;
		
		$("<div class='main' id='sharetab'></div>").appendTo($('.event_section'))
		
		folders = ['consultancy', 'event_snap', 'lab_reports', 'prescription', 'cost_of_care']
		// sub_folders = ['A', 'B', 'C']
		$('#sharetab').empty()

		console.log(this.args['selected_files'])

		if(this.args['selected_files']){
			console.log($.arrayIntersect(folders, this.args['selected_files']))
			folders = $.arrayIntersect(folders, this.args['selected_files'])
		}
		console.log(folders)
		$.each(folders, function(i, folder){
			$(repl_str('<div id = "%(id)s">\
				<div style = "display:inline-block;margin:5%; 5%;height:80px;text-align: center !important;"> \
		 			<i class="icon-folder-close-alt icon-large"></i> %(id)s <br> \
		 		</div>\
		 		<div class="btn btn-success" id = "A" \
		 			style = "display:inline-block;margin:5%; 5%;height:80px;text-align: center !important;"> \
		 			<i class="icon-folder-close-alt icon-large"></i> <br> A\
		 		</div>\
		 		<div class="btn btn-success" id = "B" \
		 			style = "display:inline-block;margin:5%; 5%;height:80px;text-align: center !important;"> \
		 			<i class="icon-folder-close-alt icon-large"></i> <br> B\
		 		</div>\
				<div class="btn btn-success" id = "B" \
		 			style = "display:inline-block;margin:5%; 5%;height:80px;text-align: center !important;"> \
		 			<i class="icon-folder-close-alt icon-large"></i> <br> C\
		 		</div>\
		 		</div>', {'id':folder})).appendTo(i==0?$('#sharetab'):$("#"+folders[i-1]))
		})		
		this.bind_sub_section_events()
	},
	bind_sub_section_events: function(){
		var me = this;
		$('#A, #B, #C').bind('click',function(){
				$("#sharetab").remove();
				$(repl_str("<li class='active'>%(parent)s</li><li class=active'>%(id)s</li>\
					",{'id':$(this).attr('id'), 'parent':$(this).parent().attr('id')})).appendTo('.breadcrumb');
				// $('.sharetab').empty();
				me.sub_folder = $(this).attr('id');
				me.folder = $(this).parent().attr('id')
				ThumbNails.prototype.init(me.wrapper, {'folder':me.folder, 
						'sub_folder':me.sub_folder, 'profile_id':me.args['profile_id'], 
						'display':'initial', 'doc_list': me.doc_list})
				// me.render_uploader_and_files();
			})	
	},
	send_email:function(){
		var me = this;
		var uniqueNames = [];
		me.res = {}

		$.each(me.doc_list, function(i, el){
			if($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
		});

		$("form input, form textarea, form select").each(function(i, obj) {
			me.res[obj.name] = $(obj).val();
		})

		me.res['files'] = uniqueNames;
		me.res['profile_id'] = me.args['profile_id'];
		me.res['folder'] = me.folder;
		me.res['sub_folder'] = me.sub_folder;

		console.log(me.res)

		frappe.call({
			method:"phr.templates.pages.event.send_shared_data",
			args:{"data":me.res},
			callback:function(r){
				frappe.msgprint("mail has been sent!!!")
			}
		})
	}

})