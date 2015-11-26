frappe.require("assets/frappe/js/lib/jquery/jquery.ui.min.js");
frappe.require("/assets/phr/js/jquery.autocomplete.multiselect.js");

window.signup = {};

signup.bind_events = function() {

	if(!window.pageInitialized){
		signup.route();
		
		$(".form-signup").unbind("submit").submit(function(event) {
			event.preventDefault();
			$('.btn-primary').prop("disabled", true);
			var args = {};
			args.first_name = ($("#signup_firstname").val() || "").trim();
			args.middle_name = ($("#signup_middlename").val() || "").trim();
			args.last_name = ($("#signup_lastname").val() || "").trim();
			args.email_id = ($("#signup_email").val() || "").trim();
			cnf_email_id = ($("#signup_email_cnf").val() || "").trim();
			args.contact = ($("#signup_contact").val() || "").trim();
			cnf_contact = ($("#signup_contact_cnf").val() || "").trim();
			args.created_via="Desktop";

			// check if user is provider or patient
			var route = window.location.hash.slice(1);
			if (route == "provider-signup"){
				args.is_provider = true;
				args.gender = ($("#gender option:selected").val() || "").trim();
				args.registration_number = ($("#medical_reg_number").val() || "").trim();
				args.specialization= ($("#provider_specialization").val() || "").trim();
			}

			args.cmd = "phr.templates.pages.login.create_profile";

			if (!/^[0-9]+$/.test(args.contact) || !/^[0-9]+$/.test(cnf_contact)){
				frappe.msgprint(__("Valid contact number required"));
				$('.btn-primary').prop("disabled", false);
				return false;
			}
			if(!args.email_id || !valid_email(args.email_id) || !valid_email(cnf_email_id)) {
				frappe.msgprint(__("Valid email and name required"));
				$('.btn-primary').prop("disabled", false);
				return false;
			}
			else if(args.email_id != cnf_email_id){
				frappe.msgprint(__("Email Addresses doesn't match"));
				$('.btn-primary').prop("disabled", false);
				return false;
			}
			else if(args.contact != cnf_contact){
				frappe.msgprint(__("Contact Nos doesn't match"));
				$('.btn-primary').prop("disabled", false);
				return false;
			}
			// TODO medical registion number validations
			signup.call(args);
		});
	}
}

clear_credentials=function(){
	$("#patient_login_email").val("");
	$("#patient_login_password").val("");
	$("#provider_login_email").val("");
	$("#provider_login_password").val("");
}

signup.route = function() {
	var route = window.location.hash.slice(1);
	if(route == "patient-signup") route = "signup";
	else if(route == "provider-signup") route = "provider_signup";
	clear_credentials();
	signup[route]();
}

signup.signup = function() {
	//$("form").toggle(false);
	// patient sigup, hiding the provider fields
	$("#gender").addClass("hide");
	$("#provider_registration_number").addClass("hide");
	$("#specialization").addClass("hide");
	// set fields to required false
	$("#medical_reg_number").prop("required", false);
	$("#provider_specialization").prop("required", false);
	// removing all the child element from redirect-url and appending new redirect
	// URL for patient >> #patient
	$("#redirect-url").empty();
	$("<p>Already have an account?<a href='/login#patient' id='redirect-login'> Login\
	</a></p>").appendTo($("#redirect-url"))

	// $(".form-signup").css({"background-color":"white"});
	$(".form-signup").show()
	$(".form-signup").toggle(true);
	$(".form-signup").trigger("reset");
}

signup.provider_signup = function(){
	//$("form").toggle(false);
	// provider sigup, unhiding the provider fields
	$("#gender").removeClass("hide");
	$("#provider_registration_number").removeClass("hide");
	$("#specialization").removeClass("hide");
	// set fields to required
	$("#medical_reg_number").prop("required", true);
	$("#provider_specialization").prop("required", true);
	// removing all the child element from redirect-url and appending new redirect
	// URL for patient >> #provider
	$("#redirect-url").empty();
	$("<p>Already have an account?<a href='/login#provider' id='redirect-login'> Login\
	</a></p>").appendTo($("#redirect-url"))

	// $(".form-signup").css({"background-color":"white"});

	$(".form-signup").toggle(true);
	$(".form-signup").trigger("reset");
}

signup.call = function(args) {
	$('.btn-primary').prop("disabled", true);
	$.ajax({
		type: "POST",
		url: "/",
		data: args,
		dataType: "json",
		statusCode: signup.signup_handlers
	}).always(function(){
		$('.btn-primary').prop("disabled", false);
	})
}

signup.signup_handlers = (function() {
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

	var signup_handlers = {
		200: function(data) {
            if(["#patient-signup", "#provider-signup", "#forgot"].indexOf(window.location.hash)!==-1) {
				if (data.message["returncode"]==101){
					frappe.msgprint(data.message.msg_display);
					if(window.location.hash == "#patient-signup")
						setTimeout("window.location.href = '/login#patient'", 5000);
					else if (window.location.hash == "#provider-signup")
						setTimeout("window.location.href = '/login#provider'", 5000);
				}
				else{
					frappe.msgprint(data.message.msg_display);
				}
			}
		},
		417: get_error_handler(__("Oops! Something went wrong"))
	};

	return signup_handlers;
})();

frappe.ready(function() {
	if(!window.pageInitialized){
		signup.bind_events();
		window.pageInitialized = true;
		$(".form-signup, .form-forgot").removeClass("hide");
	}
});
