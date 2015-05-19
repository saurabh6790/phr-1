frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
// {% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}
{% include "templates/includes/list_view.js" %}
{% include "templates/includes/thumbnail.js" %}
{% include "templates/includes/share_phr.js" %}

window.Visit = inherit(ListView,{
	init: function(wrapper, json_file, profile_id, entity_id){
		var me = this;
		this.wrapper = wrapper;
		$('#main-con').empty();
		this.selected_files = [];
		this.dms_file_list = [];
		this.doc_list = [];
		this.profile_id = profile_id;
		ListView.prototype.init(this.wrapper, {"file_name": "visit", 
			'cmd':"event.get_visit_data",
			'tab_at': 4,
			'profile_id':profile_id})

		$('.new_controller').hide()
		$('.save_controller').remove();

		$('<tr>\
			<td></td>\
			<td></td>\
			<td></td>\
			<td></td>\
			<td></td>\
			<td align="center"><input type="checkbox" id="consultancy"  value="Consultancy" ></td>\
			<td align="center"><input type="checkbox" id="event_snap"  value="Event Snap" ></td>\
			<td align="center"><input type="checkbox" id="lab_reports"  value="Lab Reports" ></td>\
			<td align="center"><input type="checkbox" id="prescription"  value="Prescription" ></td>\
			<td align="center"><input type="checkbox" id="cost_of_care"  value="Cost Of Care" ></td>\
		</tr>').insertBefore('table > thead > tr:first')
		this.add_share_event()
		this.add_search_event()
		scroll_top()
		
	},
	add_share_event:function(){
		var me=this;
		$("#share").click(function(){
			var fg = false;

			$('.table').find('thead').each(function(){
				var row = $(this);
				$('th', row).map(function(index, th) {
					if ($(th).find('input[type="checkbox"]').is(':checked')) {
						me.selected_files.push($(th).find('input[type="checkbox"]').attr('id'))
					}
				})
			})
			$('.table').find('tr').each(function () {
				var row = $(this);
				$('td', row).map(function(index, td) {
					if ($(td).find('input[name="visit"]').is(':checked')) {
						me.selected_files.push($(td).find('input[name="visit"]').attr('id'))
						fg = true;
					}
				});
			})
			
			if (fg){
				$('<li><a nohref>Share Pannel</a></li>').click(function(){
					$(this).nextAll().remove()
					// $(this).remove()
					$('.uploader').remove();
					SharePhr.prototype.init(me.wrapper,  {"file_name" : "share_phr_visit", 
						"method": "visit", 
						'event_id': $(me.selected_files).last()[0], 
						'selected_files':me.selected_files, 
						'doc_list': me.doc_list, 
						"profile_id":me.profile_id
					})
					
				}).appendTo('.breadcrumb');	

				SharePhr.prototype.init(me.wrapper, {"file_name" : "share_phr_visit", 
					"method": "visit", 
					'event_id': $(me.selected_files).last()[0], 
					'selected_files':me.selected_files, 
					'doc_list': me.doc_list, 
					"profile_id":me.profile_id
				})
			}
			else{
				frappe.msgprint("Please first select a Visit. ")
			}
			
		})
	},
	add_search_event:function(wrapper,json_file,profile_id,entity_id){
		var me = this;
		$('.search_event').click(function(){
			from_date=$('[name="from_date"]').val()
			to_date=$('[name="to_date"]').val()
			ListView.prototype.init(this.wrapper, {"file_name" : "visit",
			'search':"event",
			'tab_at': 4,
			'visit_date_from':from_date,
			'visit_date_to':to_date,
			'profile_id':me.profile_id})
		})
	},
	render_spans: function(){
		var me = this;
		$('.new_controller').bind('click',function(event) {
			me.bind_save_event()			
		})
	},
	bind_save_event: function(){
		var me = this;
		this.res = {}
		this.doc_list = [] 

		$('.save_controller').bind('click',function(event) {
			$("form input, form textarea, form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			frappe.call({
				method:"phr.templates.pages.event.create_event",
				args:{"data":JSON.stringify(me.res)},
				callback:function(r){
					$('<div class="event_section"></div>').appendTo($('.field-area'))
					me.render_folder_section()
	  				me.bind_events()
				}
			})
						
		})
		
	},
	render_folder_section: function(){
		var me = this;
		this.result_set = {};

		$('<button class="btn btn-primary" id="share"> Share Data </button>\
			<div class="event_section1" style = "margin:10%; 10%;">\
			<div class="btn btn-success" id = "consultancy" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
				<i class="icon-folder-close-alt icon-large"></i> <br> Consultancy\
			</div>\
			<div class="btn btn-success" id = "event_snap" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
				<i class="icon-folder-close-alt icon-large"></i> <br> Event Snaps \
			</div>\
			<div class="btn btn-success" id = "lab_reports" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
				<i class="icon-folder-close-alt icon-large"></i> <br> Lab Reports \
			</div>\
		</div>\
		<div class="event_section2" style="margin:10%; 10%;">\
			<div class="btn btn-success" id = "prescription" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
				<i class="icon-folder-close-alt icon-large"></i>  <br> Prescription \
			</div>\
			<div class="btn btn-success" id = "cost_of_care" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;">\
				<i class="icon-folder-close-alt icon-large"></i>  <br> Cost of Care \
			</div>\
		</div>\
	    ').appendTo($('.event_section'))

		$('#share').click(function(){
			$("form input, form textarea").each(function(i, obj) {
				me.result_set[obj.name] = $(obj).val();
			})
			SharePhr.prototype.init(me.wrapper, {'fields':[
				{'fieldname':'event_date','fieldtype':'date', 'label':'Date'},
				{'fieldname':'event','fieldtype':'link','label':'Event',  'options':'Events'},
				{'fieldname':'description','fieldtype':'text', 'label':'Description'},
				{'fieldname':'provider_name','fieldtype':'data', 'label':'Provider Name'}
			], 'values': me.result_set})
		})
	},
	bind_events: function(){
		var me = this;
		$('#consultancy, #event_snap, #lab_reports, #prescription, #cost_of_care')
			.bind('click',function(){
				$('.breadcrumb').empty();

				$(repl_str("<a href='#'>Event</a>\
						<a href='#' class='active'>%(id)s</a>\
					",{'id':$(this).attr('id')})).appendTo('.breadcrumb');

				//$('.event_section').empty();
				me.folder = $(this).attr('id');
				me.render_sub_sections();
			})
	},
	render_sub_sections: function(){
		var me = this;
		$('<div class="event_sub_section" style = "margin:10%; 10%;">\
				<div class="btn btn-success" id = "A" \
					style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
					<i class="icon-folder-close-alt icon-large"></i> <br> A\
				</div>\
				<div class="btn btn-success" id = "B" \
					style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
					<i class="icon-folder-close-alt icon-large"></i> <br> B \
				</div>\
				<div class="btn btn-success" id = "C" \
					style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
					<i class="icon-folder-close-alt icon-large"></i> <br> C \
				</div>\
			</div>\
		').appendTo($('.event_section'));
		
		me.bind_sub_section_events();
	},
	bind_sub_section_events: function(){
		var me = this;
		$('#A, #B, #C').bind('click',function(){
				$(".breadCrumb").last().remove();
				$(repl_str("<a href='#' class='active'>%(id)s</a>\
					",{'id':$(this).attr('id')})).appendTo('.breadcrumb');
				$('.uploader').empty();
				me.sub_folder = $(this).attr('id');
				ThumbNails.prototype.init(me.wrapper, {'folder':me.folder, 
						'sub_folder':me.sub_folder, 
						'profile_id': me.profile_id, 
						'display':'initial',
						'dms_file_list': me.dms_file_list})
				// me.render_uploader_and_files();
			})	
	},
	// render_uploader_and_files:function(){
	// 	var me = this;
	// 	$('.uploader').empty();
	// 	$('<div class="uploader">\
	// 		<h4> Uploaded Files </h4>\
	// 		<div id="uploaded_file">\
	// 		</div>\
	// 		<hr><br>\
	// 		<div>\
	// 			<h4> Uploaded Files </h4>\
	// 			<div id="attach"> Attach </div>\
	// 		</div>\
	// 		<button id="share_data">Share Data</button></div>').appendTo($('.field-area'))
		
	// 	$('#share_data').click(function(){
	// 		me.get_selected_files();
	// 	})

	// 	this.show_attachments();

	// 	upload.make({
	// 		parent: $('#attach'),
	// 		args:{'profile_id':'123456789', 'folder':me.folder, 'sub_folder': me.sub_folder},
	// 		callback:function(attachment, r) {
	// 			console.log("in attachment callback")
	// 			me.render_uploader_and_files();
	// 		}
	// 	});
	// },
	// show_attachments:function(){
	// 	var me = this;
	// 	frappe.call({
	// 		method:"phr.templates.pages.event.get_attachments",
	// 		args:{'profile_id':'123456789', 'folder':me.folder, 'sub_folder': me.sub_folder},
	// 		callback:function(r){
	// 			me.create_attachement_renderer(r.message)
	// 		}
	// 	})
	// },
	// create_attachement_renderer: function(attachments){
	// 	var me = this;
	// 	this.table = $('<table></table>').appendTo('#uploaded_file');

	// 	row = $('<tr>').appendTo(this.table)
	// 	$.each(attachments, function(i, attachment){
	// 		console.log(i)
	// 		if((i+1)%4 == 0){
	// 			row = $('<tr>').appendTo(me.table)
	// 		}
	// 		attachment['display'] = 'none'
	// 		me.render_attachemnt(attachment, row)
	// 	})
	// },
	// render_attachemnt:function(attachment, row){
	// 	if(attachment['type'] == 'pdf' || attachment['type'] == 'PDF'){
	// 		$td = $(repl('<td style="width:200px;\
	// 						height:200px;padding-right:20px;vertical-align:top;">\
	// 					',attachment)).appendTo(row)
	// 		thumbnail("/"+attachment['path']+"/"+attachment['file_name'], $td, attachment['file_name'])
	// 	}
	// 	if((/\.(gif|jpg|jpeg|tiff|png)$/i).test(attachment['file_name']) ){
	// 		$('<td style="width:200px;height:200px;padding-right:20px;vertical-align:top;">')
	// 			.html($(repl('<div>\
	// 					<input type="checkbox" style="display:%(display)s" value="%(file_name)s" >\
	// 				</div>\
	// 				<img style="height:150px;" src="/%(path)s/%(file_name)s">\
	// 				<br><label>%(file_name)s</label>',attachment))).appendTo(row)
	// 	}		
	// },
	// get_selected_files: function(){
	// 	var me = this;
	// 	this.selected_files = []
	// 	$(this.table).find('tr').each(function () {
	// 		var row = $(this);
	// 		$('td', row).map(function(index, td) {
	// 		    if ($(td).find('input[type="checkbox"]').is(':checked')) {
	// 				me.selected_files.push($(td).find('input[type="checkbox"]').val())
	// 			}
	// 		});
	// 	})
	// 	this.send_email()
	// },
	// send_email:function(){
	// 	var me = this;
	// 	frappe.call({
	// 		method:"phr.templates.pages.event.send_shared_data",
	// 		args:{'files': me.selected_files, 'profile_id':'123456789', 'folder':me.folder, 'sub_folder': me.sub_folder},
	// 		callback:function(r){
	// 			frappe.msgprint("mail has been sent!!!")
	// 		}
	// 	})
	// }

})