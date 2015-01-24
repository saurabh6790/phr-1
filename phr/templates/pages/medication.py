import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path,cstr
from phr.templates.pages.patient import get_data_to_render
import datetime


@frappe.whitelist(allow_guest=True)
def get_medication_data(data):
	print "################################################################################"
	fields, values, tab = get_data_to_render(data)

	pos = 0
	for filed_dict in fields:
		pos =+ 1
		if 'options' in filed_dict.keys(): 
			options = filed_dict.get('options')
			break
	data=json.loads(data)
	medication_list=fetch_values_from_db(data)
	for d in medication_list:
		options.extend([["",d.medicine_name, d.dosage,d.from_date_time,d.to_date_time,d.additional_info]])

	return {
		'options': options,
		'listview': fields
	}

def fetch_values_from_db(data):
	med_list=frappe.db.sql("""select * from 
		`tabMedication` 
		where profile_id='%s' order by creation desc"""%(data["profile_id"]),as_dict=1)
	return med_list




@frappe.whitelist(allow_guest=True)
def make_medication_entry(data):
	c_medication=save_data(data)
	response=get_medication_data(data)
	return response


def save_data(data):
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
	return med.name

def get_formatted_date(strdate=None):
	return datetime.datetime.strptime(strdate,"%d/%m/%Y %H:%M:%S")