frappe.provide("frappe");
frappe.provide("templates/includes");
frappe.require("assets/phr/pdfjs/build/pdf.js")
{% include "templates/includes/list_view.js" %}
{% include "templates/includes/share_phr.js" %}
{% include "templates/includes/treeview.js" %}
{% include "templates/includes/dashboard_renderer.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}
{% include "templates/includes/thumbnail.js" %}
{% include "templates/includes/provider_operations.js" %}


window.Events = inherit(ListView,{
	init: function(wrapper, json_file, profile_id, entity_id){
		this.wrapper = wrapper;
		$('#main-con').empty();
		var me = this;
		this.selected_files = [];
		this.dms_file_list = [];
		this.profile_id = profile_id;
		this.doc_list = [];
		this.from_date=$('[name="from_date"]').val()
		this.to_date=$('[name="to_date"]').val()
		
		ListView.prototype.init(this.wrapper, {"file_name" : "event",
			'cmd':"event.get_event_data",
			'tab_at': 4,
			'event_date_from':this.from_date,
			'event_date_to':this.to_date,
			'profile_id':profile_id})
		
		$('.save_controller').remove();
		this.add_share_event()
		this.render_spans()
		this.get_linked_providers()
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
					if ($(td).find('input[name="event"]').is(':checked')) {
						me.selected_files.push($(td).find('input[name="event"]').attr('id'))
						fg = true;
					}
				});
			})
			if (fg){
				SharePhr.prototype.init(me.wrapper, {"file_name" : "share_phr", 
					"method": "event", 
					'event_id': $(me.selected_files).last()[0], 
					'selected_files':me.selected_files, 
					'doc_list': me.doc_list, 
					"profile_id":me.profile_id
				})	
			}
			else{
				frappe.msgprint("Please first select an event. ")
			}
		})
	},
	add_search_event:function(wrapper,json_file,profile_id,entity_id){
		var me = this;
		$('.search_event').click(function(){
			from_date=$('[name="from_date"]').val()
			to_date=$('[name="to_date"]').val()
			ListView.prototype.init(this.wrapper, {"file_name" : "event",
			'search':"event",
			'tab_at': 4,
			'event_date_from':from_date,
			'event_date_to':to_date,
			'profile_id':me.profile_id})
		})
	},
	open_form:function(event_id, event_title, profile_id, res, req_id, visit_id){
		var me = this;
		this.profile_id = profile_id;
		this.req_id = req_id;
		$('#main-con').empty();
		RenderFormFields.prototype.init(me.wrapper, {"file_name" : "event", "method": 'event'}, event_id)
		this.set_values(res)
		me.bind_save_event()
		$(repl_str('<li><a nohref>%(event_title)s</a></li>',{'event_title': event_title})).click(function(){
			$(this).nextAll().remove()
			$(this).remove()
			me.open_form(event_id, event_title, me.profile_id, '', me.req_id)
		}).appendTo('.breadcrumb');
		scroll_top()
		this.make_multi_select_div()

		//$('<div class="event_section" style="margin-top:-10%;"></div>').appendTo($('.field-area'))
		$('.visit_details').css("display","inherit")
		$('.upload_files').css("display","inherit")
		$('.files_section').css("display","inherit")
		$('.comment_section').css("display","inherit")

		disable_fields(['event_title', 'event_date', 'event_symptoms'])

		$($('[name="visit_date"]').parents()[3]).css("display", "inherit")

		$($('[name="diagnosis_desc"]').parents()[3]).css("display", "inherit");
		$($($('[name="event_symptoms"]').parents()[2]).find('p')).css("display", "none")
		$("#provider_name").click(function(){
			// me.dialog_oprations()
			ProviderOperations.prototype.dialog_oprations({'file_name':"provider_search", "wrapper":this.wrapper})
		})
		
  		this.write_visit_file(event_id, profile_id)
  		this.make_tree_view(event_id, visit_id)
		this.get_linked_providers()
  		this.set_provider_details()
  		if (!this.req_id){
  			this.make_share_pannel(event_id)
  		}	
		this.make_comment_section(event_title, profile_id)
	},
	get_linked_providers:function(){
		if(frappe.get_cookie("user_type")=='provider'){
			ProviderOperations.prototype.get_linked_providers(sessionStorage.getItem("pid"))
		}
		else{
			ProviderOperations.prototype.get_linked_providers(this.profile_id)
		}
	},
	set_values: function(res){
		if(res && res['entityid']){
			$.each(res, function(field, value){
				if(field!='event_symptoms') $('[name="'+field+'"]').val(value)
			})
		}
	},
	write_visit_file: function(event_id, profile_id, visit_id){
		frappe.call({
			method:"phr.templates.pages.event.image_writter",
			args:{'profile_id': profile_id, "event_id": event_id, "visit_id": visit_id},
			callback:function(r){
				// no callback
			}
		})

	},
	make_share_pannel: function(event_id){
		var me = this;
		$('#share').click(function(){
			$("form input, form textarea").each(function(i, obj) {
				me.result_set[obj.name] = $(obj).val();
			})	
			$('<li><a nohref>Share Panel</a></li>').click(function(){
					$(this).nextAll().remove()
					$('.uploader').remove();
					$("form input, form textarea").each(function(i, obj) {
						me.result_set[obj.name] = $(obj).val();

					})
					me.open_sharing_pannel(event_id)
			}).appendTo('.breadcrumb');			
			me.open_sharing_pannel(event_id)
		})		
	},
	make_tree_view:function(event_id, visit_id){
		var me = this;
		me.dms_file_list = me.dms_file_list ? me.dms_file_list : [];
		if(visit_id) file_counts=me.get_visit_file_counts(visit_id,this.profile_id,me.dms_file_list)
		else file_counts=me.get_event_file_counts(event_id,this.profile_id,me.dms_file_list)
	},
	get_event_file_counts:function(event_id, profile_id, dms_file_list){
		var me = this;
		frappe.call({
			"method":"phr.templates.pages.event.get_individual_event_count_for_badges",
			"args":{"event_id":event_id,"profile_id":profile_id, "req_id": me.req_id},
			callback:function(r){
				TreeView.prototype.init({'profile_id': profile_id, 'dms_file_list':dms_file_list, 
						'display': 'none',"event_dict":r.message.event_dict,"sub_event_count":r.message.sub_event_count, 
						'req_id': me.req_id})
			}
		})
	},
	get_visit_file_counts:function(visit_id, profile_id, dms_file_list){
		var me = this;
		frappe.call({
			"method":"phr.templates.pages.event.get_individual_visit_count_for_badges",
			"args":{"visit_id":visit_id,"profile_id":me.profile_id, "req_id": me.req_id},
			callback:function(r){
				TreeView.prototype.init({'profile_id': me.profile_id, 'dms_file_list':dms_file_list, 
						'display': 'none',"event_dict":r.message.event_dict,"sub_event_count":r.message.sub_event_count, 
						'req_id': me.req_id})
			}
		})
	},
	make_comment_section: function(){
		var me = this;
		PHRComments.prototype.init({"wrapper":$('.comments'), 
				"provider_id" : frappe.get_cookie("profile_id"), 
				"profile_id": me.profile_id,
				"event_id": $("[name='entityid']").val(),
				"event_title":$("[name='event_title']").val()
		});
	},
	make_multi_select_div: function(){
		$.each($('[name="event_symptoms"]').val().split(','), function(i, val){
			$('<div class="ui-autocomplete-multiselect-item">'+val+'</div>').insertAfter($('[name="event_symptoms"]'))
		})
		$('[name="event_symptoms"]').val('');
	},
	render_spans: function(){
		var me = this;
		$('.new_controller').bind('click',function(event) {
			$('.breadcrumb li').nextAll().remove()
			me.bind_save_event()
			$('<li><a nohref> New Event </a></li>').appendTo('.breadcrumb');	
		})
	},
	bind_save_event: function(){
		var me = this;
		me.bind_date_validation()
		this.res = {}
		this.result_set = {};
		this.doc_list = []
		$('.save_controller').unbind('click').click(function(event) {
			var  validate = me.validate_form();
			if(validate['fg']){
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
				me.res['pid'] = sessionStorage.getItem("pid")
				me.res['dms_file_list'] = me.dms_file_list;
				me.res['complaints'] = complaints_array;
				if (sessionStorage.getItem("cid")!=sessionStorage.getItem("pid")){
					me.res['cname'] = sessionStorage.getItem("cname")
				}
				me.edata = me.res;
				frappe.call({
					method:"phr.templates.pages.event.create_update_event",
					args:{"data":JSON.stringify(me.res), "req_id": me.req_id},
					callback:function(r){
						// console.log(r.message)
						if(!r.message['exe']){
							$('.breadcrumb li:last').remove()
							NProgress.done();
							console.log(["Saved", r.message.returncode])
							if(r.message.returncode == 103 || r.message.returncode == 116){
								me.dms_file_list = [];
								me.open_form(r.message.entityid, $('[name="event_title"]').val(), me.profile_id, me.res, me.req_id);	
								frappe.msgprint("Saved")
								if(r.message.returncode == 116){
									console.log([me.edata])
									me.notify_about_update(me.edata)
								}
							}
							else{
								frappe.msgprint(r.message.message_summary);
							}
						}
						else{
							NProgress.done();
						}
					}
				})
			}
			else{
				frappe.msgprint(validate['msg'])
			}			
		})
	},
	bind_date_validation:function(){
		$('form input[name="event_date"]').bind('change', function() { 
			val=$(this).val()
			if (diffDays(parseDate(val),new Date().setHours(0,0,0,0)) < 0) { 
				$(this).val("")
				frappe.msgprint("Event Date should be past or current")
			}
		});
	},
	notify_about_update: function(data){
		frappe.call({
			method:"phr.templates.pages.event.notify_about_update",
			args:{"data":data},
			callback:function(r){
				console.log("testing done")
			}
		})
	},
	validate_form:function(){
  		var me=this;
  		var fg=true
  		var msg = ''
  		$("form input[required], form textarea[required], form select[required]").each(function(i, obj) {
  			if ($(this).val()=="" && $(this).is(':visible')){
  				$(this).css({"border": "1px solid #999","border-color": "red" });
  				msg = "Fields Marked as Red Are Mandatory"
  				fg = false
  			}
  		})
  		if($("form input[name='doctor_name']").val() && $("form input[name='doctor_id']").val()==''){
  			msg = "Please Add a provider first then save the event"
  			fg = false
  		}

  		return { 
  			"fg" : fg,
  			"msg" : msg
  		}
  	},
	open_sharing_pannel: function(event_id){
		var me = this;
		SharePhr.prototype.init(me.wrapper, {"file_name" : "share_phr", 'values': me.result_set, 'doc_list': me.doc_list, "profile_id":me.profile_id,"event_id":event_id, "selected_files": me.selected_files})
	},
	set_provider_details:function(){
		var me = this;
		frappe.call({
			method:"phr.templates.pages.provider.get_self_details",
			args:{"profile_id":frappe.get_cookie("profile_id")},
			callback:function(r){
				if(r.message){
					$('[name="email_id"]').val(r.message[0]['email'])
					$('[name="number"]').val(r.message[0]['mobile_number'])
					$('[name="doctor_id"]').val(r.message[0]['provider_id'])
					$('[name="provider_type"]').val(r.message[0]['provider_type'])
					$('[name="doctor_name"]').val(r.message[0]['provider_name'])
				}
			}
		})
	}
})