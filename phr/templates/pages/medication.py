import frappe
import json
import os 
import sys
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path,cstr,cint, date_diff, today, add_days, getdate
from phr.templates.pages.patient import get_data_to_render,formatted_date,get_sms_template
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
	
	if isinstance(data, unicode) or  isinstance(data, str):
		data=json.loads(data)

	medication_list=fetch_values_from_db(data)
	for d in medication_list:
		if d.status=='Active':
			rows.extend([["<a nohref class='medication' id='%s'><i class='icon-unlock' data-toggle='tooltip' data-placement='top' title='Deactivate'></i></a>"%d.name,d.medicine_name, d.dosage,formatted_date(d.from_date_time),formatted_date(d.to_date_time),d.additional_info,d.status]])
		else:
			rows.extend([["<i class='icon-lock' data-toggle='tooltip' data-placement='top'>",d.medicine_name, d.dosage,formatted_date(d.from_date_time),formatted_date(d.to_date_time),d.additional_info,d.status]])	

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
	if day_exists(data):
		try:
			c_medication=save_data(data)
			response=get_medication_data(data)
			medication=json.loads(data)
			sub="Medication for"+" "+medication.get('medicine_name')+" created"
			make_log(medication.get('profile_id'),"Medication","create",sub)
			return response
		except ValueError:
			msg = "Unexpected error: Invalid Date"
			return {"exe" : msg}
		except :
			msg = "Unexpected error: %s "% sys.exc_info()[0] 
			return {"exe" : msg}
	else:
		return {'exe': 'Selected day is not in specified date range'}

def day_exists(data):
	data = json.loads(data)
	if data.get('day'):
		day_mapper = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6}
		
		for i in range(0, date_diff(str_date(data.get('to_date_time')), str_date(data.get('from_date_time')))+1 ):
			if day_mapper.get(data.get('day')) == getdate(add_days(str_date(data.get('from_date_time')), i)).weekday():
				return True
		return False

	else:
		return True

def str_date(str_date):
	import datetime
	return datetime.datetime.strptime(str_date, '%d/%m/%Y').strftime('%Y-%m-%d')

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

	if past_dated(to_date):
		med.status = "Inactive"

	med.ignore_permissions = True
	med.insert()
	return med.name

def past_dated(to_date):
	if date_diff(cstr(to_date).split(' ')[0], today()) < 0:
		return True
	return False

def get_formatted_date(strdate=None):
	if strdate:
		return datetime.datetime.strptime(strdate,"%d/%m/%Y")

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
	print "############################~~~~~~~~~~~~Medications~~~~~~~~~~~~~~~~~~~############"
	recipient_list=[]
	med_list=get_medictions_to_notify()
	build_list,msg=fetch_data_from_medications(med_list,recipient_list)
	if build_list:
		for no in build_list:
			no_list=[]
			no_list.append(no)
			send_sms(no_list,msg=msg[no])

def get_medictions_to_notify():
	med_list=frappe.db.sql_list("""select name from 
		`tabMedication` 
		where to_date_time >= now() 
		and status='Active'""")
	return med_list

@frappe.whitelist(allow_guest=True)
def update_status_of_medication():
	frappe.db.sql("""update `tabMedication` 
		set status='Inactive'
		where to_date_time < CURDATE() 
		and status='Active'""")
	return "done"
def fetch_data_from_medications(med_list,recipient_list):
	if med_list:
		msg={}
		for md in med_list:
			mobj=frappe.get_doc("Medication",md)
			fobj=frappe.get_doc("Dosage",mobj.dosage)
			options=json.loads(mobj.options)
			for d in fobj.get('dosage_fields'):
				time_diff=0
				if d.fieldtype=="time":
					time_now = datetime.datetime.strftime(datetime.datetime.now(),'%H:%M')
					med_time=datetime.datetime.strptime(options[d.fieldname], '%I:%M %p').strftime('%H:%M')
					time_diff=(datetime.datetime.strptime(med_time,'%H:%M')-datetime.datetime.strptime(time_now,'%H:%M')).total_seconds()/60
		
				elif d.fieldname=="datetime":
					now_time=datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S.%f')
					now_time_str= datetime.datetime.strptime(now_time, '%Y-%m-%d %H:%M:%S.%f')
					med_time = datetime.datetime.strptime(options[d.fieldname], '%Y-%m-%d %H:%M:%S.%f')
					time_diff=(med_time-time_now).total_seconds()/60

				if time_diff and (time_diff > 0 and time_diff < 6):
					user=frappe.get_doc("User",frappe.db.get_value("User",{"profile_id":mobj.profile_id},"name"))
					if user:
						recipient_list.append(user.contact)
						msg[user.contact]=get_sms_template("medication",{"medication":mobj.get('medicine_name')})
					else:
						data=search_profile_data_from_solr(mobj.profile_id)
						if data['mobile']:
							recipient_list.append(data["mobile"])
							msg[data["mobile"]]=get_sms_template("medication",{"medication":mobj.get('medicine_name')})
							
		return recipient_list,msg




