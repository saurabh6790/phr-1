import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path,cstr
from phr.templates.pages.patient import get_data_to_render
import datetime


@frappe.whitelist(allow_guest=True)
def get_medication_data(data):
	
	fields, values, tab = get_data_to_render(data)

	pos = 0
	for filed_dict in fields:
		pos =+ 1
		if 'options' in filed_dict.keys(): 
			options = filed_dict.get('options')
			break

	data=json.loads(data)
	#response=get_response(url, json.dumps({"profileId":data.get('profile_id')}), request_type)
	#res_data = json.loads(response.text)
	# if json.loads(res_data.get('phr')).get('eventList'):
	# 	for visit in json.loads(res_data.get('phr')).get('eventList'):
	# 		print visit
	# 		options.extend([['<input type="checkbox" id = "%s">'%visit['entityid'], '<a nohref id="%s"> %s </a>'%(visit['entityid'],visit['event_title']), '15/01/2015', 
	# 				visit['event_title']+'<br>'+visit['event_descripton'], 'DOC', 'Test Doc']])
	# return {
	# 	'options': options,
	# 	'listview': fields
	# }
	return {
		'options': options,
		'listview': fields
	}

@frappe.whitelist(allow_guest=True)
def make_medication_entry(data):
	print data
	obj=json.loads(data)
	from_date=get_formatted_date(obj.get('from_date_time'))
	to_date=get_formatted_date(obj.get('to_date_time'))
	print frappe.user.name
	user=frappe.get_doc("User",frappe.user.name)
	print "======"
	print frappe.user
	med = frappe.get_doc({
		"doctype":"Medication",
		"profile_id":obj.get('profile_id'),
		"medicine_name":obj.get('medicine_name'),
		"dosage":obj.get('dosage'),
		"from_date_time":from_date,
		"to_date_time":to_date,
		"additional_info":obj.get('additional_info'),
		"created_via": "Web"
	})
	med.ignore_permissions = True
	med.insert()
	return frappe.get_doc('Medication',med.name)

def get_formatted_date(strdate=None):
	return datetime.datetime.strptime(strdate,"%d/%m/%Y %H:%M:%S")