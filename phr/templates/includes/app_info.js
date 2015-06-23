function user_info_setter(){
	if (!frappe.get_cookie('user_id') || !frappe.get_cookie('full_name') || !frappe.get_cookie('profile_id') || !frappe.get_cookie('user_type') || !sessionStorage.getItem('pid')){
		
		window.location.href = "login";
	}
}