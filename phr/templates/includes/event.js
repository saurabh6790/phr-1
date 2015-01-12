frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}
{% include "templates/includes/list_view.js" %}
{% include "templates/includes/thumbnail.js" %}
{% include "templates/includes/share_phr.js" %}

var Event = inherit(ListView,{
	init: function(wrapper, json_file, profile_id, entity_id){
		this.wrapper = wrapper;
		var me = this;
		this.selected_files = [];
		this.profile_id = profile_id
		ListView.prototype.init(this.wrapper, {'fields':[
						{'fieldname':'event_date','fieldtype':'date','label':'Date'},
						{'fieldname':'event_title','fieldtype':'link','label':'Event Name'},
						{'fieldname':'event_descripton','fieldtype':'text','label':'Description'},
						{'fieldname':'provider_type','fieldtype':'select','label':'Healthcare Provider', 'options':['Doc', 'Hospital', 'Lab']},
						{'fieldname':'','fieldtype':'column_break','label':''},
						{'fieldname':'provider_name','fieldtype':'data','label':'Provider Name'},
						{'fieldname':'number','fieldtype':'data','label':'Contact Number'},
						{'fieldname':'email_id','fieldtype':'data','label':'Email Id'}
					], 'listview':[{'fieldname':'event','fieldtype':'link','label':'Event','options':'Events'},
			{'fieldname':'','fieldtype':'column_break','label':''},
			{'fieldname':'date','fieldtype':'date','label':'Date'},
			{'fieldname':'','fieldtype':'section_break','label':''},
			{'fieldname':'tab','fieldtype':'table','label':'T1',
				 'options':[['','Event Id','Event Date', 'Event Name', 'Provider Type', 'Provider Name', 'Consultancy', 
				 				'Event Snaps', 'Lab Reports', 'Prescription', 'Cost of Care'],
				 			]}],
			'cmd':"get_event_data",
			'tab_at': 4,
			'profile_id':profile_id})
		
		$('<tr>\
			<td></td>\
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

		$("<button class='btn btn-primary'> Share </button>").click(function(){
				$('.table').find('tr').each(function () {
				var row = $(this);
				$('td', row).map(function(index, td) {
				    if ($(td).find('input[type="checkbox"]').is(':checked')) {
						me.selected_files.push($(td).find('input[type="checkbox"]').attr('id'))
					}
				});
			})

			SharePhr.prototype.init(me.wrapper, {'fields':[
				{'fieldname':'event_date','fieldtype':'date', 'label':'Date'},
				{'fieldname':'event_title','fieldtype':'link','label':'Event Name',  'options':'Events'},
				{'fieldname':'event_descripton','fieldtype':'text', 'label':'Description'},
				{'fieldname':'provider_name','fieldtype':'data', 'label':'Provider Name'},
				{'fieldname':'email_body','fieldtype':'text', 'label':'Email Body'},
				{'fieldname':'share_with','fieldtype':'data', 'label':'Share With'}
			], "method": 'event' ,'event_id': $(me.selected_files).last()[0], 'selected_files':me.selected_files, 'doc_list': me.doc_list, "profile_id":me.profile_id})
			
		}).appendTo($('.field-area'))
		// this.open_form()
		$("table tr td a").click(function (e) { 
			me.open_form($(this).attr('id'), $(this).html())
		})

		this.render_spans()
	},
	open_form:function(event_id, event_title){
		var me = this;
		RenderFormFields.prototype.init(me.wrapper, {'fields':[
					{'fieldname':'event_date','fieldtype':'date','label':'Date'},
					{'fieldname':'event_title','fieldtype':'link','label':'Event Name'},
					{'fieldname':'event_descripton','fieldtype':'text','label':'Description'},
					{'fieldname':'provider_type','fieldtype':'select','label':'Healthcare Provider', 'options':['Doc', 'Hospital', 'Lab']},
					{'fieldname':'','fieldtype':'column_break','label':''},
					{'fieldname':'provider_name','fieldtype':'data','label':'Provider Name'},
					{'fieldname':'number','fieldtype':'data','label':'Contact Number'},
					{'fieldname':'email_id','fieldtype':'data','label':'Email Id'}
				], "method": 'event'}, event_id)

		me.bind_save_event()
		$(repl_str('<li><a nohref>%(event_title)s</a></li>',{'event_title': event_title})).click(function(){
			$(this).nextAll().remove()
			$(this).remove()
			me.open_form(event_id, event_title)
		}).appendTo('.breadcrumb');
		$('<div class="event_section"></div>').appendTo($('.field-area'))
		me.render_folder_section()
  		me.bind_events()

		
	},
	render_spans: function(){
		var me = this;
		$('.new_controller').bind('click',function(event) {
			me.bind_save_event()
			$('<li><a nohref> New Event </a></li>').appendTo('.breadcrumb');
			// me.render_folder_section()		
		})
	},
	bind_save_event: function(){
		var me = this;
		this.res = {}
		this.result_set = {};
		this.doc_list = [] 
		$('.save_controller').bind('click',function(event) {
			$("form input, form textarea, form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			me.res['profile_id'] = me.profile_id;
			frappe.call({
				method:"phr.templates.pages.event.create_event",
				args:{"data":JSON.stringify(me.res)},
				callback:function(r){
					$('.breadcrumb li:last').remove()
					if(r.message.returncode == 103){
						me.open_form(r.message.entityid, r.message.event_title)	
					}
					else{
						alert(r.message.message_summary)
					}
				}
			})
						
		})
		
	},
	render_folder_section: function(){
		var me = this;
		$('.event_section').empty()
		$('.uploader').remove()
		$('<button class="btn btn-primary" id="share"> Share Data </button>').appendTo($('.save_controller'))
		$('<div class="event_section1" style = "margin:10%; 10%;">\
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
			
			$('<li><a nohref>Share Pannel</a></li>').click(function(){
					$(this).nextAll().remove()
					// $(this).remove()
					$('.uploader').remove();
					$("form input, form textarea").each(function(i, obj) {
						me.result_set[obj.name] = $(obj).val();

					})
					console.log([me.result_set, 'test'])
					me.render_folder_section()
					me.open_sharing_pannel()
			}).appendTo('.breadcrumb');			
			me.open_sharing_pannel()
		})
	},
	open_sharing_pannel: function(){
		var me = this;
		console.log(['me.result_set', me.doc_list])
		SharePhr.prototype.init(me.wrapper, {'fields':[
				{'fieldname':'event_date','fieldtype':'date', 'label':'Date'},
				{'fieldname':'event_title','fieldtype':'link','label':'Event Name',  'options':'Events'},
				{'fieldname':'event_descripton','fieldtype':'text', 'label':'Description'},
				{'fieldname':'provider_name','fieldtype':'data', 'label':'Provider Name'},
				{'fieldname':'email_body','fieldtype':'text', 'label':'Email Body'},
				{'fieldname':'share_with','fieldtype':'data', 'label':'Share With'}
			], 'values': me.result_set, 'doc_list': me.doc_list, "profile_id":me.profile_id})
	},
	bind_events: function(){
		var me = this;
		$('#consultancy, #event_snap, #lab_reports, #prescription, #cost_of_care')
			.bind('click',function(){
				// $('.breadcrumb').empty();
				$(repl_str('<li><a nohref>%(event_id)s</a></li>',{'event_id': $(this).attr('id')})).click(function(){
					$(this).nextAll().remove()
					// $(this).remove()
					$('.uploader').remove();
					me.render_sub_sections()
					// me.bind_sub_section_events()
				}).appendTo('.breadcrumb');
				
				// $(repl_str("<li><a nohref>%(id)s</a></li>\
				// 	",{'id':$(this).attr('id')})).appendTo('.breadcrumb');

				$('.event_section').empty();
				me.folder = $(this).attr('id');
				me.render_sub_sections();
			})
	},
	render_sub_sections: function(){
		var me = this;
		$('.event_section').empty()
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
				$(repl_str("<li class=active'>%(id)s</li>\
					",{'id':$(this).attr('id')})).appendTo('.breadcrumb');
				$('.uploader').remove();
				me.sub_folder = $(this).attr('id');
				ThumbNails.prototype.init(me.wrapper, {'folder':me.folder, 
						'sub_folder':me.sub_folder, 'profile_id': me.profile_id, 'display':'none'})
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