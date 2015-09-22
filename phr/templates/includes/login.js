frappe.require("/assets/phr/js/jquery.autocomplete.multiselect.js");
window.disable_signup = {{ disable_signup and "true" or "false" }};

window.login = {};

login.bind_events = function() {
	if(!window.pageInitialized){
		$(window).on("hashchange", function() {
			login.route();
		});
		//login.route();
		$(".form-login").on("submit", function(event) {
			event.preventDefault();
			$('.btn-primary').prop("disabled", true);
			var args = {};
			args.cmd = "login";
			if(window.location.hash == "#patient"){
				args.usr = ($("#patient_login_email").val() || "").trim();
				args.pwd = $("#patient_login_password").val();
				args.login_as = "Patient";
			}
			else{
				args.usr = ($("#provider_login_email").val() || "").trim();
				args.pwd = $("#provider_login_password").val();
				args.login_as = "Provider";
			}
			if(!args.usr || !args.pwd) {
				frappe.msgprint(__("Both login and password required"));
				return false;
			}
			login.call(args);
		});

		$(".form-forgot").on("submit", function(event) {
			event.preventDefault();
			$('.btn-primary').prop("disabled", true);
			var args = {};
			args.cmd = "phr.templates.pages.login.reset_password";
			args.user = ($("#forgot_email").val() || "").trim();
			if(!args.user) {
				frappe.msgprint(__("Valid Login id required."));
				return false;
			}
			login.call(args);
		});

		$("#feedback-form").on("submit", function(event) {
			event.preventDefault();
			var args = {};
			args.cmd = "phr.templates.pages.login.add_feedback";
			args.name = ($("#fbk-name").val() || "").trim();
			args.email = ($("#fbk-email").val() || "").trim();
			args.mobile = ($("#fbk-mob").val() || "").trim();
			args.comment = ($("#fbk-com").val() || "").trim();

			if(!args.name || !args.email || !args.comment) {
				frappe.msgprint(__("Fill data into all fields"));
				return false;
			}
			login.call(args);
		});
	}
}

clear_credentials=function(){
	$("#patient_login_email").val("");
	$("#patient_login_password").val("");
	$("#provider_login_email").val("");
	$("#provider_login_password").val("");
}

login.route = function() {
	var route = window.location.hash.slice(1);
	if(!route) route = "login";
	else if(route == "patient-signup") route = "signup";
	else if(route == "provider-signup") route = "provider_signup";
	clear_credentials();
	login[route]();
}

login.login = function() {
	$("form").toggle(false);
	$("#feedback-form").toggle(true);
	$(".form-login").toggle(true);
}

login.forgot = function() {
	$("form").toggle(false);
	$("#feedback-form").toggle(true);
	$(".form-forgot").toggle(true);
}

login.patient = function() {
	$("form").toggle(false);
	$(".patient-login").toggle(true);
	// resetting provider & patient login form
	$(".provider-login").trigger("reset");
	$(".patient-login").trigger("reset");

	$("#provider").removeClass("active");
	$("#li-provider").removeClass("active");
	$("#patient").addClass("active");
	$("#li-patient").addClass("active");
	$("#feedback-form").toggle(true);
}

login.provider = function() {
	$("form").toggle(false);
	$(".provider-login").toggle(true);
	// resetting provider & patient login form
	$(".patient-login").trigger("reset");
	$(".provider-login").trigger("reset");

	$("#patient").removeClass("active");
	$("#li-patient").removeClass("active");
	$("#provider").addClass("active");
	$("#li-provider").addClass("active");
	$("#feedback-form").toggle(true);
}

// Login
login.call = function(args) {
	$('.btn-primary').prop("disabled", true);
	$.ajax({
		type: "POST",
		url: "/",
		data: args,
		dataType: "json",
		statusCode: login.login_handlers
	}).always(function(){
		$('.btn-primary').prop("disabled", false);
	})
}

login.login_handlers = (function() {
	var get_error_handler = function(default_message) {
		return function(xhr, data) {
			console.log(data);
			if(xhr.responseJSON) {
				data = xhr.responseJSON;
			}

			var message = data._server_messages
				? JSON.parse(data._server_messages).join("\n") : default_message;
			frappe.msgprint(message);
		};
	}


	var login_handlers = {
		200: function(data) {
			console.log(data)
            if(data.message=="Logged In") {
				window.location.href = get_url_arg("redirect-to") || "/desk";
			}
			else if(data.message=="No App") {

				var url='';
				if (data.mob_v_req && data.mob_v_req=='Yes'){
					url='/verify_mobile?id='+frappe.get_cookie("profile_id")
				}
				if(localStorage) {
					var last_visited =
						localStorage.getItem("last_visited")
							|| get_url_arg("redirect-to")
							|| url
							|| data.access_link || "/index";
					localStorage.removeItem("last_visited");
					window.location.href = last_visited;
					sessionStorage.setItem("pid",frappe.get_cookie("profile_id"));
					sessionStorage.setItem("cid",frappe.get_cookie("profile_id"));
				} else {

					go_to_url= url || data.access_link || "/index"
					window.location.href = "/index";
				}
			} 
			else if(["#forgot"].indexOf(window.location.hash)!==-1) {
				frappe.msgprint(data.message.msg_display);
			}
			else if(data.message.message=="fbk"){
				frappe.msgprint(data.message.msg_display);
			}

		},
		401: get_error_handler(__("Invalid Login")),
		417: get_error_handler(__("Oops! Something went wrong"))
	};

	return login_handlers;
})();

frappe.ready(function() {
	if(!window.pageInitialized){
		window.location.href = "/login#patient";
		login.bind_events();
		window.pageInitialized = true;
		login.login();
		$(".form-signup, .form-forgot").removeClass("hide");
		$(document).trigger('login_rendered');
		// clear_credentials();
	}
});
