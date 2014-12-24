import frappe

@frappe.whitelist()
def create_profile():
	print "test"
	print frappe.form_dict['data']

@frappe.whitelist()
def validate_mobile_code():
	pass