frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}
{% include "templates/includes/list_view.js" %}


var Messages = inherit(ListView,{
	init: function(wrapper, json_file, profile_id, entity_id){
		this.wrapper = wrapper;
		var me = this;
		this.profile_id = profile_id
		//RenderFormFields.prototype.init(this.wrapper,{"file_name" : "appointments",'profile_id':profile_id},this.entityid)
		ListView.prototype.init($(document).find(".field-area"), {"file_name" : "messages",
			'cmd':"medication.get_medication_data",
			'profile_id':profile_id})

	},
	/*bind_save_event: function(){
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
		
	}*/
})