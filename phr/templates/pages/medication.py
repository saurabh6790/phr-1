import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path,cstr
from phr.templates.pages.patient import get_data_to_render
import datetime
from phr.phr.doctype.phr_activity_log.phr_activity_log import make_log

@frappe.whitelist(allow_guest=True)
def get_medication_data(data):
	print "################################################################################"
	fields, values, tab = get_data_to_render(data)

	pos = 0
	for filed_dict in fields:
		pos =+ 1
		if 'rows' in filed_dict.keys(): 
			rows = filed_dict.get('rows')
			break
	frappe.errprint(type(data))
	if isinstance(data, unicode):
		data=json.loads(data)

	medication_list=fetch_values_from_db(data)
	for d in medication_list:
		if d.status=='Active':
			rows.extend([["<a nohref class='medication' id='%s'><i class='icon-unlock' data-toggle='tooltip' data-placement='top' title='Deactivate'></i></a>"%d.name,d.medicine_name, d.dosage,d.from_date_time,d.to_date_time,d.additional_info,d.status]])
		else:
			rows.extend([["",d.medicine_name, d.dosage,d.from_date_time,d.to_date_time,d.additional_info,d.status]])	

	return {
		'rows': rows,
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
	medication=json.loads(data)
	sub="Medication for"+" "+medication.get('medicine_name')+" created"
	make_log(medication.get('profile_id'),"Medication","create",sub)
	return response


@frappe.whitelist(allow_guest=True)
def get_dosage_types():
	dt=frappe.db.sql("""select name from `tabDosage`""",as_list=1)
	return dt


def save_data(data):
	print data
	obj=json.loads(data)
	from_date=get_formatted_date(obj.get('from_date_time'))
	to_date=get_formatted_date(obj.get('to_date_time'))
	options=get_options(obj)
	print frappe.user.name
	user=frappe.get_doc("User",frappe.user.name)
	print "======"
	print frappe.user
	med = frappe.get_doc({
		"doctype":"Medication",
		"profile_id":obj.get('profile_id'),
		"medicine_name":obj.get('medicine_name'),
		"options":options,
		"dosage":obj.get('dosage_type'),
		"from_date_time":from_date,
		"to_date_time":to_date,
		"additional_info":obj.get('additional_info'),
		"status":"Active",
		"created_via": "Web"
	})
	med.ignore_permissions = True
	med.insert()
	return med.name

def get_formatted_date(strdate=None):
	if strdate:
		return datetime.datetime.strptime(strdate,"%d/%m/%Y %H:%M:%S")

def get_options(obj):
	options={}
	dt=frappe.get_doc("Dosage",obj.get('dosage_type'))
	if dt:
		dtc=dt.get('dosage_fields')
		for d in dtc:
			options[d.fieldname]=obj.get(d.fieldname)
	return json.dumps(options)


@frappe.whitelist(allow_guest=True)
def get_option(obj):
	pass

@frappe.whitelist(allow_guest=True)
def update_status(data):
	d=json.loads(data)
	frappe.errprint(d["docname"])
	med=frappe.get_doc("Medication",d["docname"])
	med.status='Inactive'
	med.save(ignore_permissions=True)
	response=get_medication_data(data)
	return response

