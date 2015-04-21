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
		$(this.wrapper).empty()
		$('.field-area').empty()
		ListView.prototype.init($(document).find(".field-area"), {"file_name" : "messages",
			'cmd':"messages.get_messages_list",
			'profile_id':this.profile_id})
		$('.new_controller').hide();
		$('.save_controller').hide();

	},
	
})