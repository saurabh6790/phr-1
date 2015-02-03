frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
// {% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/event.js" %}
{% include "templates/includes/visit.js" %}
{% include "templates/includes/list_view.js" %}
{% include "templates/includes/profile.js" %}
{% include "templates/includes/linked_phr.js" %}
{% include "templates/includes/provider.js" %}
{% include "templates/includes/medication.js" %}
{% include "templates/includes/appointments.js" %}
{% include "templates/includes/messages.js" %}
/*
  Format for method Classes
  ClassName.prototype.init(wrapper,name_of_json_file,entityid,operation_entity)
*/
$(document).ready(function () {
	profile_id=frappe.get_cookie("profile_id")
	ListView.prototype.init(this.wrapper, {'file_name':"provider_page",
		'cmd':"provider_page.get_profile_list",
		'tab_at': 0,
		'profile_id': frappe.get_cookie("profile_id")
	})

	$("table tr td a").bind('click', function (e) { 
		render_shared_data($(this).attr('id'))
	})
})

render_shared_data = function(patient_profile_id){
	alert(profile_id)
	ListView.prototype.init(this.wrapper, {'file_name':"temp_share_event",
		'cmd':"provider_page.get_patient_data",
		'tab_at': 4,
		"patient_profile_id": patient_profile_id,
		'profile_id': frappe.get_cookie("profile_id")
	})
	$("table tr td a").bind('click', function (e) {
		Event.prototype.open_form($(this).attr('id'), $(this).html(), frappe.get_cookie("profile_id"))
	})
}