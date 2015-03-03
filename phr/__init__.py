import frappe
import json
from frappe.utils import cstr

@frappe.whitelist(allow_guest=True)
def create_profile(data):
	from templates.pages.login import create_profile
	data = json.loads(data)
	
	res = create_profile(data.get('first_name'), data.get('middle_name'), 
			data.get('last_name'), data.get('email'), data.get('contact'),data.get('received_from'))
	
	return res

@frappe.whitelist(allow_guest=True)
def validate_mobile_code(data):
	from phr.verifier import verify_mobile
	data = json.loads(data)
	res = verify_mobile(data.get('profile_id'),data.get('verification_code'))
	return res

@frappe.whitelist(allow_guest=True)
def get_linked_provides(data):
	from templates.pages.event import get_linked_providers
	data = json.loads(data)
	res = get_linked_providers(data.get('profile_id'))
	return res

@frappe.whitelist(allow_guest=True)
def get_event_name():
	return frappe.db.sql(""" select name from tabEvents """, as_dict=1)

@frappe.whitelist(allow_guest=True)
def getProfileVisitData(data):
	data = json.loads(data)

	data_dict = {'file_name': 'visit', 
			"profile_id": data.get('profile_id'), 
			'param':'listview', 
			'other_param': ''}

	from templates.pages.event import get_visit_data

	res = get_visit_data(json.dumps(data_dict))
	import re

	TAG_RE = re.compile(r'<[^>]+>')

	return eval(TAG_RE.sub('', cstr(res.get('rows')[1:])))

@frappe.whitelist(allow_guest=True)
def getProfileEventData(data):
	data = json.loads(data)

	data_dict = {'file_name': 'event', 
			"profile_id": data.get('profile_id'), 
			'param':'listview', 
			'other_param': ''}

	from templates.pages.event import get_event_data

	res = get_event_data(json.dumps(data_dict))

	import re

	TAG_RE = re.compile(r'<[^>]+>')

	return eval(TAG_RE.sub('', cstr(res.get('rows')[1:])))
