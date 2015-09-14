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
{% include "templates/includes/profile_settings.js" %}
{% include "templates/includes/linked_phr.js" %}
{% include "templates/includes/provider.js" %}
{% include "templates/includes/medication.js" %}
{% include "templates/includes/appointments_pro.js" %}
{% include "templates/includes/appointments.js" %}
{% include "templates/includes/messages.js" %}
{% include "templates/includes/custom_dialog.js" %}
{% include "templates/includes/disease_monitoring.js" %}
{% include "templates/includes/dashboard_renderer.js" %}
{% include "templates/includes/todo.js" %}
{% include "templates/includes/mobile_verifier.js" %}
{% include "templates/includes/app_info.js" %}
frappe.require("/assets/phr/js/jquery.blockUI.js");
/*
  Format for method Classes
  ClassName.prototype.init(wrapper,name_of_json_file,entityid,operation_entity)
*/
$(document).ready(function () {
	// blocl UI if provider is not verified
	user_info_setter()
	if (frappe.get_cookie("user_type") && (/provider/.test(self.location.href)) && frappe.get_cookie("user_type") != 'provider'){
		frappe.msgprint("Not Allowed")
		window.location.href = "/patient";
	}
	if(!window.full_name) {
		if(localStorage) {
			localStorage.setItem("last_visited",
				window.location.href.replace(window.location.origin, ""));
		}
		window.location.href = "login";
	}
	else{
		frappe.call({
			method:"phr.templates.pages.provider.is_verified_provider",
			args:{
				"profile_id":sessionStorage.getItem("pid"),
			},
			freeze:true,
			async:false,
			callback: function(r){
				block_provider();
				$("#logout").unbind("click").click(function(){
					logout_provider();
				});
			}
		});

		var db = new render_dashboard();
		// db.render_emer_details(sessionStorage.getItem("pid"))
		db.render_providers(sessionStorage.getItem("pid"))
		db.render_to_do(sessionStorage.getItem("pid"))
		db.render_advertisements(sessionStorage.getItem("pid"))
		$("#home").on("click",function(){
			$('#phr').addClass("hide");
			$('.breadcrumb').empty()
			$('<li></li>').appendTo('.breadcrumb')
			//$('.linked-phr').empty()
			$('#cphrname').empty()
			$('.cdd').addClass('hide')
			$('.save_controller').hide()
			$('.new_controller').hide()
			NProgress.start();
			profile_id = sessionStorage.getItem("pid")
			$('#linkedphr').show()
			sessionStorage.setItem("cid",profile_id)
			$('#profile').attr('data-name',profile_id)
			$('.field-area').empty()
			$('#main-con').empty()
			render_middle(profile_id);
			var db = new render_dashboard();
			// db.render_emer_details(profile_id)
			db.render_providers(profile_id)
			db.render_to_do(profile_id)
			db.render_advertisements(profile_id)
			NProgress.done();
		})

		render_middle(sessionStorage.getItem("pid"))

		$('.create_linkphr').unbind("click").click(function(){
			$("#main-con").empty()
			LinkedPHR.prototype.init('',{"file_name" : "linked_patient"},"","create_linkphr", {"source": "provider"})
		})
	}
	$(".create_provider").unbind("click").click(function(){
		$('.breadcrumb').empty()
		ProviderOperations.prototype.dialog_oprations({'file_name':"provider_search", "wrapper":this.wrapper})
		NProgress.done();
	})

	$("#pprofile").unbind("click").click(function(){
		$('.cdd').addClass('hide')
		$('#cphrname').empty()
		NProgress.start();
		PatientDashboard.prototype.init($(document).find("#main-con"),
				{"file_name" : "profile", "method": "profile"},sessionStorage.getItem('pid'))
		NProgress.done();
	})
	$(".cdb").on("click",function(){
		var db = new render_dashboard();
		$('.field-area').empty()
		$('#main-con').empty()
		db.render_middle_section(sessionStorage.getItem('cid'))
	})

	$("#profile").unbind("click").click(function(){
		profile_id=sessionStorage.getItem("cid")
		$('.breadcrumb').empty()
		NProgress.start();
		PatientDashboard.prototype.init($(document).find("#main-con"),
				{"file_name" : "profile", "method": "profile"},profile_id)
		NProgress.done();
	})
	$(".patients").unbind("click").click(function(){
		profile_id=sessionStorage.getItem("pid")
		$('.breadcrumb').empty()
		$('<li></li>').appendTo('.breadcrumb')
		$('#main-con').empty()
		NProgress.start();
		ListView.prototype.init($(document).find(".field-area"), {"file_name" : "patients",
		'cmd':"provider.get_patient_data",
		'profile_id':profile_id})

		$(".cprofile").unbind("click").click(function(){
			NProgress.start();
			$('#main-con').empty()
			PatientDashboard.prototype.init($(document).find("#main-con"),
			{"file_name" : "profile", "method": "profile"},sessionStorage.getItem('cid'))
			NProgress.done();
		})
		$(".csettings").unbind("click").click(function(){
			NProgress.start();
			profile_id=sessionStorage.getItem('cid')
			sessionStorage.setItem("cid",profile_id)
			ProfileSettings.prototype.init($(document).find("#main-con"),
					{"file_name" : "profile_settings", "method": "profile"},profile_id)
			NProgress.done();
		})
		$("#share").remove()
		$(".save_controller").remove()
		$(".new_controller").remove()

		NProgress.done();
	})

	$(".psettings").unbind("click").click(function(){
		$('.cdd').addClass('hide')
		$('#cphrname').empty()
		NProgress.start();
		profile_id=sessionStorage.getItem('pid')
		sessionStorage.setItem("cid",profile_id)
		ProfileSettings.prototype.init($(document).find("#main-con"),
				{"file_name" : "provider_profile_settings", "method": "profile"},profile_id)
		NProgress.done();
	})

	$('.event').unbind("click").click(function(){
		profile_id=sessionStorage.getItem("cid")
		$('.breadcrumb').empty()
		NProgress.start();
		$('<li><a nohref>Event</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			Events.prototype.init('', '', profile_id)
		}).appendTo('.breadcrumb');
		window.Events.prototype.init('', '', profile_id)
		NProgress.done();
	})

	$('.visit').unbind("click").click(function(){
		$('.breadcrumb').empty()
		NProgress.start();
		$('<li><a nohref>Visit</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			Visit.prototype.init('', '', sessionStorage.getItem("cid"))
		}).appendTo('.breadcrumb');
		Visit.prototype.init('', '', sessionStorage.getItem("cid"))
		NProgress.done();
	})

	$('.medications').unbind("click").click(function(){
		$('.breadcrumb').empty()
		NProgress.start();
		$('<li><a nohref>Medications</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			Medications.prototype.init($(document).find("#main-con"), '', sessionStorage.getItem("cid"))
		}).appendTo('.breadcrumb');
		Medications.prototype.init($(document).find("#main-con"),'', sessionStorage.getItem("cid"))
		NProgress.done();
	})

	$('.dmonit').unbind("click").click(function(){
		$('.breadcrumb').empty()
		NProgress.start();
		$('<li><a nohref>Disease Monitoring</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			DiseaseMonitoring.prototype.init($(document).find("#main-con"), '', sessionStorage.getItem("cid"))
		}).appendTo('.breadcrumb');
		DiseaseMonitoring.prototype.init($(document).find("#main-con"),'', sessionStorage.getItem("cid"))
		NProgress.done();
	})

	$('.appoint_pro').unbind("click").click(function(){
		$('.breadcrumb').empty()
		NProgress.start();
		$('<li><a nohref>Appointments</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			AppointmentsPro.prototype.init($(document).find("#main-con"), '', sessionStorage.getItem("pid"))
		}).appendTo('.breadcrumb');
		AppointmentsPro.prototype.init($(document).find("#main-con"),'', sessionStorage.getItem("pid"))
		NProgress.done();
	})

	$('.appoint').unbind("click").click(function(){
		$('.breadcrumb').empty()
		NProgress.start();
		$('<li><a nohref>Appointments</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			Appointments.prototype.init($(document).find("#main-con"), '', sessionStorage.getItem("cid"))
		}).appendTo('.breadcrumb');
		Appointments.prototype.init($(document).find("#main-con"),'', sessionStorage.getItem("cid"))
		NProgress.done();
	})

	$('.msg').unbind("click").click(function(){
		$('.breadcrumb').empty()
		NProgress.start();
		$('<li><a nohref>Messages</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			Messages.prototype.init($(document).find("#main-con"), '', sessionStorage.getItem("cid"))
		}).appendTo('.breadcrumb');
		Messages.prototype.init($(document).find("#main-con"),'', sessionStorage.getItem("cid"))
		NProgress.done();
	})

	$(".create_todo").unbind("click").click(function(){
		NProgress.start();
		ToDo.prototype.init($(document).find("#main-con"),
			{"cmd":"make_todo"},sessionStorage.getItem("pid"),"")
		NProgress.done();
	})

})
open_patient = function(profile_id,name){
	sessionStorage.setItem("cname",name)
	sessionStorage.setItem("cid",profile_id)
	var db = new render_dashboard();
	db.render_LPHR_name()
	$('#phr').removeClass("hide");
	$('.field-area').empty()
	$('#main-con').empty()
	$('.breadcrumb').empty()
	$('<li></li>').appendTo('.breadcrumb')
	$('.new_controller').hide()
	$('.save_controller').hide()
	$('#linkedphr').hide()
	db.render_middle_section(profile_id)
	$('#profile').attr('data-name',profile_id)
}

render_middle = function(profile_id){
	$(".field-area").empty();
	RenderFormFields.prototype.init($("#main-con"), {'file_name':'provider_page'});
	$('a[data-toggle="tab"]').unbind("click").click(function (e) {
		e.target // newly activated tab
		e.relatedTarget // previous active tab
	 		// alert(e.target)
		request_renderer($(this).attr('href'), profile_id)
	});
	request_renderer('#my_req', profile_id);
}

request_renderer = function(target, profile_id){
	target = target.split('#')[1]
	frappe.call({
		method:"phr.templates.pages.provider_page.get_request",
		args:{'target':target, 'provider_id': profile_id},
		callback:function(r){
			RenderFormFields.prototype.init($("#"+target), {'fields': r.message})
			$("#share").remove()
			$(".save_controller").remove()
		}
	})
}

accept_request=function(request_id, provider_id, profile_id, event_id, doc_name){
	NProgress.start();
	frappe.call({
		method:"phr.templates.pages.provider_page.update_flag",
		args:{"req_id": request_id, 'provider_id': provider_id, 'profile_id': profile_id, 'event_id': event_id, 'doc_name': doc_name},
		callback:function(r){
			frappe.msgprint("Request has been Accepted")
			request_renderer('#my_req', provider_id)
			NProgress.done();
		}
	})
}

reject_request = function(request_id, provider_id){
	var d = new Dialog();
	var res = []
	d.init({'fields':[{"fieldname": "rej_reason", "fieldtype": "text", "label": "Reason", "placeholder":''}], 'title':'Rejection Reason'})
	d.show()
	$('.modal-footer .btn-primary').click(function(){
			$(".modal-body form input, .modal-body form textarea, .modal-body form select").each(function(i, obj) {
				res[obj.name] = $(obj).val();
			})
			res["received_from"]="Desktop";
			update_rejected_request(request_id, d, res, provider_id)

		})

}

update_rejected_request = function(request_id, d, res, provider_id){
	NProgress.start();
	frappe.call({
		method:"phr.templates.pages.provider_page.update_request_record",
		args:{"req_id": request_id, 'rej_reason': res['rej_reason']},
		callback:function(r){
			NProgress.done();
			d.hide()
			request_renderer('#my_req', provider_id)
		}
	})
}

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
	// console.log(requests)
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
	ListView.prototype.init(this.wrapper, {'file_name':"temp_share_event",
		'cmd':"provider_page.get_patient_data",
		'tab_at': 4,
		"patient_profile_id": patient_profile_id,
		'profile_id': frappe.get_cookie("profile_id")
	})
}

block_provider = function(){
	var blockProvider = $("<div id='not_verified' style='display:none; \
						cursor: default'><h5>Your profile under verification, \
						you will get a call from our support team shortly</h5>\
						<input type='button' class='btn btn-success btn-sm' \
						id='logout' value='Logout' /></div>")

	$.blockUI({
		message:blockProvider,
		css: {
			border: 'none',
			padding: '15px',
			backgroundColor: '#FFF',
			'-webkit-border-radius': '10px',
			'-moz-border-radius': '10px',
			opacity: 1,
			color: '#fff'
		}
	});
	// $(".navbar-default").block({message:null});
	$(".navbar-collapse").block({message:null});
	$(".navbar-header").block({message:null});
	$(".app-aside").block({message:null});
	$(".page-footer").block({message:null});

	$(".navbar-collapse").css({"border-bottom":"none"});
	$(".navbar-header").css({"border-bottom":"none"});
	$(".navbar-header").css({"border-right":"none"});
	$(".page-footer").css({"border-top":"none"});
}

logout_provider = function(){
	return frappe.call({
		method:'logout',
		callback: function(r) {
			if(r.exc) {
				return;
			}
			window.location.href = '/';
		}
	});
}
