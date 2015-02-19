frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}
{% include "templates/includes/list_view.js" %}
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
		me.bind_save_event()

	},
	bind_save_event: function(){
		var me = this;
		this.res = {}
		this.result_set = {};
		this.doc_list = [] 
		$('form input[required],form textarea[required],form select[required]').bind('change', function() { 
   			if (!$(this).val()){
   				$(this).css({"border": "1px solid #999","border-color": "red" });
   			}
   			else{
   				$(this).css({"border": "1px solid #999","border-color": "F3F2F5" });	
   			}
		});
		$('.update').bind('click',function(event) {
			NProgress.start();
			var validated=me.validate_form()
			if (validated==true){
			
				$("form input, form textarea, form select").each(function(i, obj) {
					me.res[obj.name] = $(obj).val();
				})
				me.res['profile_id'] = me.profile_id;
				me.res['file_name']="appointments";
				me.res['param']="listview";
				frappe.call({
					method:"phr.templates.pages.appointments.make_appomiments_entry",
					args:{"data":JSON.stringify(me.res)},
					callback:function(r){
						NProgress.done();
						if(r.message){
							me.update_list_view(r.message)
							email_msg='Linked PHR Has Created Appointment'
							text_msg='Linked PHR Has Created Appointment'
							send_linkedphr_updates(email_msg,text_msg,"Appointment")
						}
						else{
							
						}
					}
				})
			}
			else{
				NProgress.done();
				frappe.msgprint("Fields Marked as Red Are Mandatory")
				return false
			}		
						
		})
	},
  	validate_form:function(){
  		var me=this;
  		var fg=true
  		$("form input[required],form textarea[required],form select[required]").each(function(i, obj) {
  			if ($(this).val()==""){
  				$(this).css({"border": "1px solid #999","border-color": "red" });
  				fg=false
  			}
  		})
  		return fg	
  		
  	},
	update_list_view:function(data){
		var me = this;
		RenderFormFields.prototype.init($(".field-area"), {'fields': data['listview']})
		me.bind_save_event()
	}
})