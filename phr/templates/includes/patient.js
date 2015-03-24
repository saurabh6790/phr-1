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
{% include "templates/includes/disease_monitoring.js" %}
{% include "templates/includes/dashboard_renderer.js" %}
{% include "templates/includes/todo.js" %}
/*
  Format for method Classes
  ClassName.prototype.init(wrapper,name_of_json_file,entityid,operation_entity)
*/
 window.onload = function () {
    noBack();
 }
 function noBack() {
    window.history.forward();
 }
$(document).ready(function () {
	//window.history.forward();
	/*window.onunload = function() {
    	null;
	};
	setTimeout("preventBack()", 0);*/
	//alert(frappe.get_cookie("profile_id"))
	//console.log(sessionStorage.getItem("pid"))
	//preventBack();
	   
	if (!sessionStorage.getItem("pid") || frappe.get_cookie("profile_id")!=sessionStorage.getItem("pid")){
		sessionStorage.setItem("pid",frappe.get_cookie("profile_id"))
		sessionStorage.setItem("cid",frappe.get_cookie("profile_id"))
	}

	$("[data-toggle='popover']").popover();
	
	if(!window.full_name) {
		if(localStorage) {
			localStorage.setItem("last_visited",
				window.location.href.replace(window.location.origin, ""));
		}
		window.location.href = "login";
	}
	else{
		if (sessionStorage.getItem("cid")!=sessionStorage.getItem("pid")){

			$('#linkedphr').hide()
			var db = new render_dashboard();
			db.render_LPHR_name()
		}
		else{
			
		}	download_phr()
		console.log([sessionStorage.getItem("cid"),sessionStorage.getItem("pid")])
		NProgress.start();
		profile_id=sessionStorage.getItem("cid")
		var db = new render_dashboard();
		db.render_providers(profile_id)
		db.render_linked_phr(profile_id)
		db.render_middle_section(profile_id)
		db.render_emer_details(profile_id)
		db.render_to_do(profile_id)
		db.render_advertisements(profile_id)
		$('#profile').attr('data-name',profile_id)
		$('#home').attr('data-name',profile_id)
		bind_events(db)
		NProgress.done();
	}
})
function download_phr(){
	$('<a nohref class="list-group-item-side chome"><div><i class="icon-download"></i> Download PHR</div></a>').appendTo('.linked-phr').unbind("click").click(function(){
				args={
					"cmd": "phr.templates.pages.profile.get_phr_pdf",
					'profile_id': sessionStorage.getItem("pid")
				}
				//cmd="phr.templates.pages.profile.verify_mobile"
				$.ajax({
					url: '/',
					type: 'POST',
					data: args,
					success: function(data) {
						console.log(data)
						window.open(data['message']['url'], '_blank')
					}
				});
	})
	
}
function preventBack() {
    	window.history.forward();
}
function bind_events(){
	profile_id=sessionStorage.getItem("cid")
	$("#home").on("click",function(){
		$('.breadcrumb').empty()
		$('.linked-phr').empty()
		$('.save_controller').hide()
		$('.new_controller').hide()
		NProgress.start();
		profile_id=sessionStorage.getItem("pid")
		$('#linkedphr').show()
		sessionStorage.setItem("cid",profile_id)
		$('#profile').attr('data-name',profile_id)
		var db = new render_dashboard();
		$('.field-area').empty()
		$('#main-con').empty()
		download_phr()
		db.render_providers(profile_id)
		db.render_linked_phr(profile_id)
		db.render_middle_section(profile_id)
		db.render_to_do(profile_id)
		db.render_advertisements(profile_id)
		NProgress.done();
	})
	$("#profile").unbind("click").click(function(){
		profile_id=sessionStorage.getItem("cid")
		$('.breadcrumb').empty()
		NProgress.start();
		$('<li><a nohref>Profile</a></li>').click(function(){
			PatientDashboard.prototype.init($(document).find("#main-con"),
				{"file_name" : "profile", "method": "profile"},profile_id)
		}).appendTo('.breadcrumb');
		PatientDashboard.prototype.init($(document).find("#main-con"),
				{"file_name" : "profile", "method": "profile"},profile_id)	
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
	$('.create_linkphr').unbind("click").click(function(){
		if (!(sessionStorage.getItem("lphrs")>=10)){
			$('.breadcrumb').empty()
			NProgress.start();
			$('<li><a nohref>New Linked PHR</a></li>').click(function(){
				LinkedPHR.prototype.init($(document).find("#main-con"),
				{"file_name" : "linked_patient"},"","create_linkphr")
			}).appendTo('.breadcrumb');
			LinkedPHR.prototype.init($(document).find("#main-con"),
				{"file_name" : "linked_patient"},"","create_linkphr")
			NProgress.done();
		}
		else{
			frappe.msgprint("Linked PHR's Limit Exceeded.Please Contact Admin or Delink One of Existing PHR")
		}
	})
	$(".create_provider").unbind("click").click(function(){
		$('.breadcrumb').empty()
		/*NProgress.start();
		$('<li><a nohref>New Provider</a></li>').click(function(){
			Provider.prototype.init($(document).find("#main-con"),
				{"file_name" : "provider"},"","create_provider")
		}).appendTo('.breadcrumb');
		Provider.prototype.init($(document).find("#main-con"),
				{"file_name" : "provider"},"","create_provider")*/
		Events.prototype.dialog_oprations()
		NProgress.done();
	})
	$(".create_todo").unbind("click").click(function(){
		NProgress.start();
		ToDo.prototype.init($(document).find("#main-con"),
			{"cmd":"make_todo"},profile_id,"")
		NProgress.done();	
	})

	$(".ped").unbind("click").click(function(){
		profile_id=sessionStorage.getItem("pid")
		//var html='<div style="border:1px solid black;width:400px;height:238px;align:center"><div width=100% height=50%%><div width=30%>Logo</div><div width=65%>Name of Application</div></div><hr><div width=100%><div width=30%><img src="'+frappe.get_cookie("user_image")+'"></div><div width=65%>Name: Anand Pawar</br>Blood Group: b+ve</br>Contact No: 9860733789</br>Emer Contact:9860733789<br><img src="'+sessionStorage.getItem("barcode")+'"></div></div></div>'
		frappe.call({
			method:'phr.templates.pages.profile.get_pdf',
			args:{"profile_id":profile_id},
			callback: function(r) {
				if(r.message) {
					window.open(r.message, '_blank')
				}
			}
		});		
	})
	
}

