frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}
{% include "templates/includes/list_view.js" %}


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
			me.res['file_name']="appointments";
			me.res['param']="listview";
			frappe.call({
				method:"phr.templates.pages.appointments.make_appomiments_entry",
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
		var me = this;
		RenderFormFields.prototype.init($(".field-area"), {'fields': data['listview']})
		me.bind_save_event()
	}
})