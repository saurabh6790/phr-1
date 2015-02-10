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
{% include "templates/includes/custom_dialog.js" %}


window.Events = inherit(ListView,{
	init: function(wrapper, json_file, profile_id, entity_id){
		this.wrapper = wrapper;
		$('#main-con').empty();
		var me = this;
		this.selected_files = [];
		this.dms_file_list = [];
		this.profile_id = profile_id
		ListView.prototype.init(this.wrapper, {"file_name" : "event",
			'cmd':"event.get_event_data",
			'tab_at': 4,
			'profile_id':profile_id})

		$("<button class='btn btn-primary'> Share </button>").click(function(){
			$('.table').find('thead').each(function(){
				var row = $(this);
				$('th', row).map(function(index, th) {
					if ($(th).find('input[type="checkbox"]').is(':checked')) {
						console.log($(th).find('input[type="checkbox"]').attr('id'))
						me.selected_files.push($(th).find('input[type="checkbox"]').attr('id'))
					}
				})
			})
			
			$('.table').find('tr').each(function () {
				var row = $(this);
				$('td', row).map(function(index, td) {
					if ($(td).find('input[name="event"]').is(':checked')) {
						me.selected_files.push($(td).find('input[name="event"]').attr('id'))
					}
				});
			})
			
			SharePhr.prototype.init(me.wrapper, {"file_name" : "share_phr", 
						"method": "event", 
						'event_id': $(me.selected_files).last()[0], 
						'selected_files':me.selected_files, 
						'doc_list': me.doc_list, 
						"profile_id":me.profile_id
					})
			
		}).appendTo($('.field-area'))
		this.render_spans()
		this.get_linked_providers()
	},
	open_form:function(event_id, event_title, profile_id){
		var me = this;
		this.profile_id = profile_id;
		RenderFormFields.prototype.init(me.wrapper, {"file_name" : "event", "method": 'event'}, event_id)

		me.bind_save_event()
		$(repl_str('<li><a nohref>%(event_title)s</a></li>',{'event_title': event_title})).click(function(){
			$(this).nextAll().remove()
			$(this).remove()
			me.open_form(event_id, event_title, me.profile_id)
		}).appendTo('.breadcrumb');
		$('<div class="event_section" style="margin-top:-10%;"></div>').appendTo($('.field-area'))

		$('[name="event_date"]').attr('disabled', 'disabled')
		$($('[name="visit_date"]').parents()[3]).css("display", "inherit")

		$($('[name="diagnosis"]').parents()[3]).css("display", "inherit");
		$("#provider_name").click(function(){
			me.dialog_oprations()
		})
		me.render_folder_section()
  		me.bind_events()
  		this.get_linked_providers()
	},
	dialog_oprations: function(){
		var me = this;
		this.filters = {}
		d = new Dialog();
		d.init({"file_name":"provider_search", "title":"Provider Search"})
		d.show()
		$('<button class ="btn btn-success btn-sm" > search </button>')
			.click(function(){
				$(".modal-body form input").each(function(i, obj) {
					me.filters[obj.name] = $(obj).val();
				})
				me.render_result_table(me.filters, d)

			})
			.appendTo($('.modal-body'))
		console.log(d)
	},
	render_result_table:function(filters, d){
		var me = this;
		frappe.call({
			"method":"phr.templates.pages.event.get_providers",
			"args":{"filters":filters},
			callback:function(r){
				if(r.message){
					me.generate_table(r.message, d)	
				}
				else{
					d.hide()
					me.create_provider_linking(filters, d)
				}
			}
		})
	},
	generate_table: function(result_set, d){
		var me = this;
		this.table = $("<hr><div class='table-responsive'>\
			<table class='table table-bordered'>\
				<thead><tr></tr></thead>\
				<tbody></tbody>\
			</table>\
		</div>").appendTo('.modal-body');

		header = [["", 50], ["Provider Name", 170], ["Number", 100], ["email", 100]]

		$.each(header, function(i, col) {
			$("<th>").html(col[0]).css("width", col[1]+"px")
				.appendTo(me.table.find("thead tr"));
		});

		$.each(result_set, function(i,d){
			var row = $("<tr>").appendTo(me.table.find("tbody"));
			$('<td>').html('<input type="radio" name="provider" id = "'+d[0]+'">').appendTo(row)
			$('<td>').html(d[1]).appendTo(row)
			$('<td>').html(d[2]).appendTo(row)
			$('<td>').html(d[3]).appendTo(row)
		})
		me.set_provider(d)
	},
	set_provider:function(d){
		$('.modal-footer .btn-primary').click(function(){
			$('.table').find('tr').each(function () {
				var row = $(this);
				var $td = $('td', row);
				if ($td.find('input[name="provider"]').is(':checked')) {
					$('[name="doctor_id"]').val($td.find('input[name="provider"]').attr('id'))
					$('[name="doctor_name"]').val($($td[1]).html())
					$('[name="email_id"]').val($($td[2]).html())
					$('[name="number"]').val($($td[3]).html())
					d.hide();
				}
			})
		})
	},
	create_provider_linking:function(filters, d){
		var me = this;
		d.init({"file_name":"provider", "values": filters})
		d.show()
		me.bind_provider_creation(d)
	},
	bind_provider_creation:function(d){
		var me = this;
		this.res = {}
		$('.modal-footer .btn-primary').click(function(){
			$(".modal-body form input, .modal-body form textarea, .modal-body form select").each(function(i, obj) {
				console.log(obj)
				me.res[obj.name] = $(obj).val();
			})
			console.log(me.res)
			me.res["received_from"]="Desktop"
			me.res["provider"]=true
			me.create_provider(me.res, d)
		})
	},
	create_provider: function(res, d){
		frappe.call({
			method: "phr.templates.pages.provider.create_provider",
			args:{'data':res},
			callback:function(r){
				if(r.message.returncode==129){
					d.hide()
				}
			}
		})
	},
	render_spans: function(){
		var me = this;
		$('.new_controller').bind('click',function(event) {
			me.bind_save_event()
			$('<li><a nohref> New Event </a></li>').appendTo('.breadcrumb');
			// me.render_folder_section()		
		})
	},
	get_linked_providers:function(profile_id){
		var me = this;
		this.profile_id = profile_id ? profile_id : this.profile_id;
		frappe.call({
			method:"phr.templates.pages.event.get_linked_providers",
			args:{'profile_id':this.profile_id},
			callback:function(r){
				$('[name="doctor_name"]').autocomplete({
					open: function(){
						setTimeout(function () {
							$('.ui-autocomplete').css('z-index', 99999999999999);
						}, 0);
					},
					source: r.message,
					multiselect: false,
					select: function( event, obj) {
						$('[name="email_id"]').val(obj['item']['email'])
						$('[name="number"]').val(obj['item']['mobile'])
						$('[name="doctor_id"]').val(obj['item']['provider'])
						$('[name="provider_type"]').val(obj['item']['provider_type'])
					}
				})
			}
		})
	},
	bind_save_event: function(){
		var me = this;
		this.res = {}
		this.result_set = {};
		this.doc_list = [] 
		$('.save_controller').bind('click',function(event) {
			NProgress.start();
			$("form input, form textarea, form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			complaints = $('.ui-autocomplete-multiselect-item').toArray();
			complaints_array = [];
			$.each(complaints,function(i,j){
				temp_var = $(j)
				temp_var.find("span").remove()
				complaints_array[i] = temp_var.html();
			})
			me.res['profile_id'] = me.profile_id;
			me.res['dms_file_list'] = me.dms_file_list;
			me.res['complaints'] = complaints_array;
			
			frappe.call({
				method:"phr.templates.pages.event.create_update_event",
				args:{"data":JSON.stringify(me.res)},
				callback:function(r){
					$('.breadcrumb li:last').remove()
					console.log(r.message)
					NProgress.done();
					if(r.message.returncode == 103 || r.message.returncode == 116){
						me.open_form(r.message.entityid, $('[name="event_title"]').val(), me.profile_id);	
						me.dms_file_list = [];
						alert("Saved")
					}
					else{
						alert(r.message.message_summary);
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
			<div class="btn btn-success" id = "consultancy-11" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
				<i class="icon-folder-close-alt icon-large"></i> <br> Consultancy\
			</div>\
			<div class="btn btn-success" id = "event_snap-12" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
				<i class="icon-folder-close-alt icon-large"></i> <br> Event Snaps \
			</div>\
			<div class="btn btn-success" id = "lab_reports-13" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
				<i class="icon-folder-close-alt icon-large"></i> <br> Lab Reports \
			</div>\
		</div>\
		<div class="event_section2" style="margin:10%; 10%;">\
			<div class="btn btn-success" id = "prescription-14" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
				<i class="icon-folder-close-alt icon-large"></i>  <br> Prescription \
			</div>\
			<div class="btn btn-success" id = "cost_of_care-15" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;">\
				<i class="icon-folder-close-alt icon-large"></i>  <br> Cost of Care \
			</div>\
		</div>\
	    ').appendTo($('.event_section'))

		$('#share').click(function(){
			$("form input, form textarea").each(function(i, obj) {
				me.result_set[obj.name] = $(obj).val();
			})
			
			$('<li><a nohref>Share Panel</a></li>').click(function(){
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
		SharePhr.prototype.init(me.wrapper, {"file_name" : "share_phr", 'values': me.result_set, 'doc_list': me.doc_list, "profile_id":me.profile_id})
	},
	bind_events: function(){
		var me = this;
		me.mapper = {'consultancy-11':[{'label' : 'DOCTORS  CLINICAL NOTES', 'id':'A_51'}, 
									{'label' : 'TEST / INVESTIGATION ADVISED', 'id': 'B_52'}, 
									{'label' : 'REFERAL NOTE', 'id': 'C_53'}],
					'event_snap-12':[{'label' : 'PATIENT SNAPS', 'id' : 'A_51'},
							{'label':'CLINICAL SNAPS', 'id': 'B_52'}],
					'lab_reports-13':[{'label': 'TEST REPORTS', 'id':'A_51'}, 
							{'label':'TEST IMAGES', 'id':'B_52'}],
					'prescription-14':[{'label':'PRESCRIBED MEDICATION', 'id':'A_51'},
							{'label':'PRISCRIBED ADVICE','id':'B_52'},
							{'label':'DISCHARGE SUMMERY', 'id': 'C_53'}],
					'cost_of_care-15':[{'label': 'MEDICAL BILLS', 'id': 'A_51'}]
				}
		$('#consultancy-11, #event_snap-12, #lab_reports-13, #prescription-14, #cost_of_care-15')
			.bind('click',function(){
				// $('.breadcrumb').empty();
				$(repl_str('<li id="%(event_id)s"><a nohref>%(event_id)s</a></li>',{'event_id': $(this).attr('id')})).click(function(){
					$(this).nextAll().remove()
					// $(this).remove()
					$('.uploader').remove();
					console.log($(this).attr('id'))
					me.render_sub_sections(me.mapper[$(this).attr('id')])
					// me.bind_sub_section_events()
				}).appendTo('.breadcrumb');
				
				// $(repl_str("<li><a nohref>%(id)s</a></li>\
				// 	",{'id':$(this).attr('id')})).appendTo('.breadcrumb');

				$('.event_section').empty();
				me.folder = $(this).attr('id');
				me.render_sub_sections(me.mapper[$(this).attr('id')]);
			})
	},
	render_sub_sections: function(sub_folders){
		var me = this;
		$('.event_section').empty()
		// $('<div class="event_sub_section" style = "margin:10%; 10%;">\
		// 		<div class="btn btn-success" id = "A" \
		// 			style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
		// 			<i class="icon-folder-close-alt icon-large"></i> <br> A\
		// 		</div>\
		// 		<div class="btn btn-success" id = "B" \
		// 			style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
		// 			<i class="icon-folder-close-alt icon-large"></i> <br> B \
		// 		</div>\
		// 		<div class="btn btn-success" id = "C" \
		// 			style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
		// 			<i class="icon-folder-close-alt icon-large"></i> <br> C \
		// 		</div>\
		// 	</div>\
		// ').appendTo($('.event_section'));
	
		$('<div class="event_sub_section" style = "margin:10%; 10%;"></div>').appendTo($('.event_section'));

		$.each(sub_folders, function(i, sub_folder){
			$(repl_str('<div class="btn btn-success" id = "%(id)s" \
		 			style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
		 			<i class="icon-folder-close-alt icon-large"></i> <br> %(label)s\
		 		</div>', sub_folder)).appendTo($('.event_sub_section'));
		})
		
		me.bind_sub_section_events();
	},
	bind_sub_section_events: function(){
		var me = this;
		$('#A_51, #B_52, #C_53').bind('click',function(){
				$(".breadCrumb").last().remove();
				$(repl_str("<li class=active'>%(id)s</li>\
					",{'id':$(this).attr('id')})).appendTo('.breadcrumb');
				$('.uploader').remove();
				me.sub_folder = $(this).attr('id');
				ThumbNails.prototype.init(me.wrapper, {'folder':me.folder, 
						'sub_folder':me.sub_folder, 'profile_id': me.profile_id, 'display':'none', 
						'dms_file_list': me.dms_file_list})
				// me.render_uploader_and_files();
			})	
	}
})