import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path,cstr
from phr.templates.pages.patient import get_data_to_render
import datetime

@frappe.whitelist(allow_guest=True)
def get_appointments(data):
	print "################################################################################"
	fields, values, tab = get_data_to_render(data)

	pos = 0
	for filed_dict in fields:
		pos =+ 1
		if 'rows' in filed_dict.keys(): 
			rows = filed_dict.get('rows')
			break
	data=json.loads(data)
	apts_list=fetch_values_from_db(data)
	for d in apts_list:
		rows.extend([["",d.from_date_time,d.provider_name,d.reason]])

	return {
		'rows': rows,
		'listview': fields
	}

def fetch_values_from_db(data):
	apts_list=frappe.db.sql("""select * from 
		`tabAppointments` 
		where profile_id='%s' order by creation desc"""%(data["profile_id"]),as_dict=1)
	return apts_list

@frappe.whitelist(allow_guest=True)
def make_appomiments_entry(data):
	c_medication=save_data(data)
	response=get_appointments(data)
	return response

def save_data(data):
	print data
	obj=json.loads(data)
	from_date=get_formatted_date(obj.get('from_date_time'))
	print frappe.user.name
	user=frappe.get_doc("User",frappe.user.name)
	print "======"
	print frappe.user
	ap = frappe.get_doc({
		"doctype":"Appointments",
		"profile_id":obj.get('profile_id'),
		"from_date_time":from_date,
		"provider_name":obj.get('provider'),
		"reason":obj.get('reason'),
		"created_via": "Desktop"
	})
	ap.ignore_permissions = True
	ap.insert()
	return ap.name

def get_formatted_date(strdate=None):
	if strdate:
		return datetime.datetime.strptime(strdate,"%d/%m/%Y %H:%M:%S")

