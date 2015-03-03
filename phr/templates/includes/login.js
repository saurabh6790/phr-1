window.disable_signup = {{ disable_signup and "true" or "false" }};


window.login = {};

login.bind_events = function() {
	$(window).on("hashchange", function() {
		login.route();
	});

	$(".form-login").on("submit", function(event) {
		event.preventDefault();
		var args = {};
		args.cmd = "login";
		args.usr = ($("#login_email").val() || "").trim();
		args.pwd = $("#login_password").val();
		if(!args.usr || !args.pwd) {
			frappe.msgprint(__("Both login and password required"));
			return false;
		}
		login.call(args);
	});

	$(".form-signup").unbind("submit").submit(function(event) {
		//event.preventDefault();
		var args = {};
		args.first_name = ($("#signup_firstname").val() || "").trim();
		args.middle_name = ($("#signup_middlename").val() || "").trim();
		args.last_name = ($("#signup_lastname").val() || "").trim();
		args.email_id = ($("#signup_email").val() || "").trim();
		cnf_email_id = ($("#signup_email_cnf").val() || "").trim();
		args.contact = ($("#signup_contact").val() || "").trim();
		cnf_contact = ($("#signup_contact_cnf").val() || "").trim();
		args.cmd = "phr.templates.pages.login.create_profile";
		args.created_via="Desktop";
		if(!args.email_id || !valid_email(args.email_id) || !valid_email(cnf_email_id)) {
			frappe.msgprint(__("Valid email and name required"));
			return false;
		}
		else if(args.email_id != cnf_email_id){
			frappe.msgprint(__("Email Addresses doesn't match"));
			return false;
		}
		else if(args.contact != cnf_contact){
			frappe.msgprint(__("Contact Nos doesn't match"));
			return false;
		}
		login.call(args);
	});

	$(".form-forgot").on("submit", function(event) {
		event.preventDefault();
		var args = {};
		args.cmd = "phr.templates.pages.login.reset_password";
		args.user = ($("#forgot_email").val() || "").trim();
		if(!args.user) {
			frappe.msgprint(__("Valid Login id required."));
			return false;
		}
		login.call(args);
	});
}


login.route = function() {
	var route = window.location.hash.slice(1);
	if(!route) route = "login";
	login[route]();
}

login.login = function() {
	$("form").toggle(false);
	$(".form-login").toggle(true);
}

login.forgot = function() {
	$("form").toggle(false);
	$(".form-forgot").toggle(true);
}

login.signup = function() {
	$("form").toggle(false);
	$(".form-signup").toggle(true);
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
			if(data.message=="Logged In") {
				window.location.href = get_url_arg("redirect-to") || "/desk";
			} else if(data.message=="No App") {
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
			} else if(["#signup", "#forgot"].indexOf(window.location.hash)!==-1) {
				frappe.msgprint(data.message.msg_display);
				window.location.href = "/login";
			}
		},
		401: get_error_handler(__("Invalid Login")),
		417: get_error_handler(__("Oops! Something went wrong"))
	};

	return login_handlers;
})();

frappe.ready(function() {
	window.location.hash = "#login";
	login.bind_events();
	login.login();
	$(".form-signup, .form-forgot").removeClass("hide");
	$(document).trigger('login_rendered');
});
