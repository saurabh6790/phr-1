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
{% include "templates/includes/todo.js" %}
{% include "templates/includes/disease_monitoring.js" %}
{% include "templates/includes/dashboard_renderer.js" %}
/*
  Format for method Classes
  ClassName.prototype.init(wrapper,name_of_json_file,entityid,operation_entity)
*/
$(document).ready(function () {
	profile_id=frappe.get_cookie("profile_id")
	var db = new render_dashboard();
	db.render_providers(profile_id)
	db.render_linked_phr(profile_id)
	db.render_middle_section(profile_id)
	/*x.render_emer_details()
	x.render_to_do()
	x.bind_ids()
	x.render_middle_section()
	x.render_advertisements()*/
	bind_events()
})
function bind_events(){
	profile_id=frappe.get_cookie("profile_id")
	$("#profile").unbind("click").click(function(){
		PatientDashboard.prototype.init($(document).find("#main-con"),
			{"file_name" : "profile", "method": "profile"},profile_id)
	})
	$('.event').unbind("click").click(function(){
		$('.breadcrumb').empty()
		$('<li><a nohref>Event</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			Event.prototype.init('', '', profile_id)
		}).appendTo('.breadcrumb');
		Event.prototype.init('', '', profile_id)
	})
	$('.visit').unbind("click").click(function(){
		$('.breadcrumb').empty()
		$('<li><a nohref>Visit</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			Visit.prototype.init('', '', profile_id)
		}).appendTo('.breadcrumb');
		Visit.prototype.init('', '', profile_id)
	})
	$('.medications').unbind("click").click(function(){
		$('.breadcrumb').empty()
		$('<li><a nohref>Medications</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			Medications.prototype.init($(document).find("#main-con"), '', profile_id)
		}).appendTo('.breadcrumb');
		Medications.prototype.init($(document).find("#main-con"),'', profile_id)
	})
	$('.dmonit').unbind("click").click(function(){
		$('.breadcrumb').empty()
		$('<li><a nohref>Disease Monitoring</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			DiseaseMonitoring.prototype.init($(document).find("#main-con"), '', profile_id)
		}).appendTo('.breadcrumb');
		DiseaseMonitoring.prototype.init($(document).find("#main-con"),'', profile_id)
	})
	$('.appoint').unbind("click").click(function(){
		$('.breadcrumb').empty()
		$('<li><a nohref>Appointments</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			Appointments.prototype.init($(document).find("#main-con"), '', profile_id)
		}).appendTo('.breadcrumb');
		Appointments.prototype.init($(document).find("#main-con"),'', profile_id)
	})
	$('.msg').unbind("click").click(function(){
		$('.breadcrumb').empty()
		$('<li><a nohref>Messages</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			Messages.prototype.init($(document).find("#main-con"), '', profile_id)
		}).appendTo('.breadcrumb');
		Messages.prototype.init($(document).find("#main-con"))
	})
	$(".create_linkphr").unbind("click").click(function(){
		LinkedPHR.prototype.init($(document).find("#main-con"),
			{"file_name" : "linked_patient"},"","create_linkphr")
	})
	$(".view_linkphr").unbind("click").click(function(){
		LinkedPHR.prototype.init($(document).find("#main-con"), 
			{"file_name" : "linked_patient"},"","open_linkphr")
	})
	$(".create_provider").unbind("click").click(function(){
		Provider.prototype.init($(document).find("#main-con"),
			{"file_name" : "provider"},"","create_provider")
	})
	$(".view_provider").unbind("click").click(function(){
		Provider.prototype.init($(document).find("#main-con"), 
			{"file_name" : "provider"})
	})
	$(".create_todo").unbind("click").click(function(){
		ToDo.prototype.init($(document).find("#main-con"),
			{"cmd":"make_todo"},profile_id,"")	
	})
	
}

