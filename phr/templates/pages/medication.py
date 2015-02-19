import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path,cstr
from phr.templates.pages.patient import get_data_to_render
import datetime
from phr.phr.doctype.phr_activity_log.phr_activity_log import make_log
from erpnext.setup.doctype.sms_settings.sms_settings import send_sms
from phr.templates.pages.profile import search_profile_data_from_solr

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
	med=frappe.get_doc("Medication",d["docname"])
	med.status='Inactive'
	med.save(ignore_permissions=True)
	response=get_medication_data(data)
	return response


@frappe.whitelist(allow_guest=True)
def notify_medications():
	recipient_list=[]
	med_list=get_medictions_to_notify()
	build_list=fetch_data_from_medications(med_list,recipient_list)
	if build_list:
		send_sms(build_list,msg='Medication Time')

def get_medictions_to_notify():
	med_list=frappe.db.sql_list("""select name from 
		`tabMedication` 
		where to_date_time >= now() 
		and status='Active'""")
	return med_list

def fetch_data_from_medications(med_list,recipient_list):
	if med_list:
		for md in med_list:
			mobj=frappe.get_doc("Medication",md)
			fobj=frappe.get_doc("Dosage",mobj.dosage)
			options=json.loads(mobj.options)
			for d in fobj.get('dosage_fields'):
				time_diff=0
				if d.fieldtype==time:
					time_now = datetime.strptime(nowtime(),'%H:%M:%S.%f')
					time_g = datetime.strptime(options[d.fieldname],'%I:%M %p')
					time_c=datetime.strptime(d2.strftime('%H:%M:%S.%f'),'%H:%M:%S.%f')
					time_diff=cint((time_c-time_now // 60)%60)
				else d.fieldname==datetime:
					time_now= datetime.datetime.strptime(nowtime(), '%Y-%m-%d %H:%M:%S.%f')
					time_g = datetime.datetime.strptime(options[d.fieldname], '%Y-%m-%d %H:%M:%S.%f')
					time_diff=cint((time_c-time_now // 60)%60)
				if time_diff and (time_diff > 0 and time_diff < 6):
					user=frappe.db.get_value("User",{"profile_id":mobj.profile_id},"name")
					if user:
						recipient_list.append(user.contact)
					else:
						data=search_profile_data_from_solr(mobj.profile_id)
						sms_recipients.append(data["mobile"])
		return recipient_list





