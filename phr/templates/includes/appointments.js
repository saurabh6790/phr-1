frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/linked_phr_updates.js" %}

var Appointments = inherit(ListView,{
	init: function(wrapper, json_file, profile_id, entity_id){
		this.wrapper = wrapper;
		var me = this;
		this.profile_id = profile_id
		$(this.wrapper).empty()
		$('.field_area').empty();
		//RenderFormFields.prototype.init(this.wrapper,{"file_name" : "appointments",'profile_id':profile_id},this.entityid)
		ListView.prototype.init($(document).find(".field-area"), {"file_name" : "appointments",
			'cmd':"appointments.get_appointments",
			'profile_id':profile_id})
		$('.new_controller').remove();
		$('#share').remove()
		me.bind_save_event()
		this.get_linked_providers(profile_id)
		scroll_top()
	},
	bind_save_event: function(){
		var me = this;
		this.res = {}
		this.result_set = {};
		this.doc_list = [] 
		this.get_linked_providers(this.profile_id)

		$('form input[required],form textarea[required],form select[required]').unbind('change').bind('change', function() { 
   			if (!$(this).val()){
   				$(this).css({"border": "1px solid #999","border-color": "red" });
   			}
   			else{
   				$(this).css({"border": "1px solid #999","border-color": "F3F2F5" });	
   			}
		});

		$('form input[name="from_date_time"]').bind('blur', function() { 
			val=$(this).val()
			if (diffDays(parseDate(val),new Date().setHours(0,0,0,0)) > 0) { 
				$(this).val("")
    			frappe.msgprint("Appointment Date/Time Should not be less than Current Date/Time")
			}
		});
		$('.save_controller').bind('click',function(event) {
			NProgress.start();
			var validated=me.validate_form()
			if (validated['fg']==true){
			
				$("form input, form textarea, form select").each(function(i, obj) {
					me.res[obj.name] = $(obj).val();
				})
				me.res['profile_id'] = me.profile_id;
				me.res['file_name']="appointments";
				me.res['param']="listview";

				date =new Date()
				me.res['curr_date_time'] = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
				
				frappe.call({
					method:"phr.templates.pages.appointments.make_appomiments_entry",
					args:{"data":JSON.stringify(me.res)},
					callback:function(r){
						NProgress.done();
						if(r.message && !r.message['exe']){
							me.update_list_view(r.message)
							cname = sessionStorage.getItem("cname")
							email_msg = cname+' Has Created Appointment'
							text_msg = cname+' Has Created Appointment'
							send_linkedphr_updates(email_msg,text_msg,"Appointment",cname)
						}
						else{
							if(r.message['exe']){
								frappe.msgprint(r.message['exe'])	
							}
						}
					}
				})
			}
			else{
				NProgress.done();
				frappe.msgprint(validated['msg'])
				return false
			}		
						
		})
	},
  	validate_form:function(){
  		var me=this;
  		var fg=true
  		var msg = '';
  		$("form input[required],form textarea[required],form select[required]").each(function(i, obj) {
  			if ($(this).val()==""){
  				$(this).css({"border": "1px solid #999","border-color": "red" });
  				fg = false
  				msg = "Fields Marked as Red Are Mandatory"
  			}
  		})
  		return {'fg':fg, 'msg':	msg}
  		
  	},
	update_list_view:function(data){
		var me = this;
		RenderFormFields.prototype.init($(".field-area"), {'fields': data['listview']})
		me.bind_save_event()
		$('#share').remove()
		//$('.save_controller').remove();
	},
	get_linked_providers:function(profile_id){
		var me = this;
		frappe.call({
			method:"phr.templates.pages.event.get_linked_providers",
			args:{'profile_id':this.profile_id},
			callback:function(r){
				$('[name="provider"]').autocomplete({
					open: function(){
						setTimeout(function () {
							$('.ui-autocomplete').css('z-index', 99999999999999);
						}, 0);
					},
					source: r.message,
					multiselect: false
				})
			}
		})
	},
})