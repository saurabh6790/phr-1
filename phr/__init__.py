import frappe
import json

@frappe.whitelist(allow_guest=True)
def create_profile(data):
	from templates.pages.login import create_profile
	data = json.loads(data)
	print data
	res = create_profile(data.get('first_name'), data.get('middle_name'), 
			data.get('last_name'), data.get('email'), data.get('contact'),data.get('received_from'))
	
	return res

@frappe.whitelist(allow_guest=True)
def validate_mobile_code(data):
	from phr.verifier import verify_mobile
	data = json.loads(data)
	res = verify_mobile(data.get('profile_id'),data.get('verification_code'))
	return res