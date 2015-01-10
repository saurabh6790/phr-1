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
		RenderFormFields.prototype.init(this.wrapper, {'fields':args['fields'], 
			'values': args['values']})

		$('<div class="event_section"></div>').appendTo($('.field-area'))
		this.render_folder_section()
	 //  	me.bind_events()
	},
	render_folder_section:function(){
		var me = this;
		
		$("<div class='main' id='sharetab'></div>").appendTo($('.event_section'))
		
		folders = ['consultancy', 'event_snap', 'lab_reports', 'prescription', 'cost_of_care']
		// sub_folders = ['A', 'B', 'C']
		$('#sharetab').empty()

		$.each(folders, function(i, folder){
			$(repl_str('<div id = "%(id)s">\
				<div style = "display:inline-block;margin:5%; 5%;height:80px;text-align: center !important;"> \
		 			<i class="icon-folder-close-alt icon-large"></i> %(id)s <br> \
		 		</div>\
		 		<div class="btn btn-success" id = "A" \
		 			style = "display:inline-block;margin:5%; 5%;height:80px;text-align: center !important;"> \
		 			<i class="icon-folder-close-alt icon-large"></i> <br> A\
		 		</div>\
		 		<div class="btn btn-success" id = "A" \
		 			style = "display:inline-block;margin:5%; 5%;height:80px;text-align: center !important;"> \
		 			<i class="icon-folder-close-alt icon-large"></i> <br> B\
		 		</div>\
				<div class="btn btn-success" id = "A" \
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
				// $(".breadCrumb a").last().remove();
				$(repl_str("<a href='#' class='active'>%(id)s</a>\
					",{'id':$(this).attr('id')})).appendTo('.breadcrumb');
				$('.sharetab').empty();
				me.sub_folder = $(this).attr('id');
				console.log([$(this).parent().closest().attr('id'), $(this).parent().attr('id')])
				me.folder = $(this).parent().attr('id')
				console.log([me.sub_folder, me.folder])
				ThumbNails.prototype.init(me.wrapper, {'folder':me.folder, 
						'sub_folder':me.sub_folder, 'profile_id':'123456789', 'display':'initial'})
				// me.render_uploader_and_files();
			})	
	}

})