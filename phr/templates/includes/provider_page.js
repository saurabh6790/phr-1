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

	make_notifier()
	get_request(profile_id)

	ListView.prototype.init(this.wrapper, {'file_name':"provider_page",
		'cmd':"provider_page.get_profile_list",
		'tab_at': 0,
		'profile_id': frappe.get_cookie("profile_id")
	})

	$("table tr td a").bind('click', function (e) { 
		render_shared_data($(this).attr('id'))
	})

	$('.create_linkphr').unbind("click").click(function(){
		LinkedPHR.prototype.init('',{"file_name" : "linked_patient"},"","create_linkphr")
	})
})

make_notifier= function(){
	$('.navbar .navbar-right').append('<li class="dropdown">\
			<a class="dropdown-toggl" href="#"  data-toggle="dropdown"\
				title="'+__("Unread Messages")+'"\
				onclick="return false;"><span class="navbar-new-comments">0</span></a>\
			<ul class="dropdown-menu" id="navbar-notification">\
			</ul>\
		</li>');
	$("#navbar-notification").empty();
}

get_request=function(profile_id){
	frappe.call({
		method:"phr.templates.pages.provider_page.get_shared_request",
		args:{"profile_id": profile_id},
		callback:function(r){
			render_notifications(r.message)
		}
	})
}

render_notifications = function(requests){
	console.log(requests)
	$.each(requests, function(i, request){
		$input = $(repl('<li><a>\
					<span class="btn btn-success" id=%(name)s></span> %(module)s \
				</a></li>', { name: request[0], module: request[1] }))
			.appendTo("#navbar-notification")
			.find("a")
			.attr("data-module", "module")
			.css({"min-width":"200px", "word-wrap": "break-word"})
		
		$input.find('.btn-success').on("click", function() {
			update_flag($(this).attr('id'))
		});
	})
}

update_flag= function(req_id){
	frappe.call({
		method:"phr.templates.pages.provider_page.update_flag",
		args:{"req_id": req_id},
		callback:function(r){
			render_notifications(r.message)
		}
	})
}

render_shared_data = function(patient_profile_id){
	console.log(["in render_shared_data", patient_profile_id])
	ListView.prototype.init(this.wrapper, {'file_name':"temp_share_event",
		'cmd':"provider_page.get_patient_data",
		'tab_at': 4,
		"patient_profile_id": patient_profile_id,
		'profile_id': frappe.get_cookie("profile_id")
	})
}