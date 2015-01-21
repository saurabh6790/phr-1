frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}
{% include "templates/includes/list_view.js" %}


var Medications = inherit(ListView,{
	init: function(wrapper, json_file, profile_id, entity_id){
		this.wrapper = wrapper;
		var me = this;
		this.profile_id = profile_id
		//RenderFormFields.prototype.init(this.wrapper,{"file_name" : "medication",'profile_id':profile_id},this.entityid)
		ListView.prototype.init($(document).find(".field-area"), {"file_name" : "medication",
			'cmd':"medication.get_medication_data",
			'profile_id':profile_id})
		$('.new_controller').remove();
		me.bind_save_event()

	},
	bind_save_event: function(){
		var me = this;
		this.res = {}
		this.result_set = {};
		this.doc_list = [] 
		$('.update').bind('click',function(event) {
			console.log(["me:",me.profile_id,"this:",this.profile_id])
			$("form input, form textarea, form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			me.res['profile_id'] = me.profile_id;
			me.res['file_name']="medication";
			me.res['param']="listview";
			frappe.call({
				method:"phr.templates.pages.medication.make_medication_entry",
				args:{"data":JSON.stringify(me.res)},
				callback:function(r){
					if(r.message){
						me.update_list_view(r.message)
					}
					else{
						
					}
				}
			})
						
		})
		
	},
	update_list_view:function(data){
		RenderFormFields.prototype.init(this.wrapper, {'fields': data['listview']})
		
	}
})