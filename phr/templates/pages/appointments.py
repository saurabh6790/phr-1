import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path,cstr
from phr.templates.pages.form_generator import get_data_to_render
from phr.templates.pages.utils import get_formatted_date_time,get_sms_template
import datetime
from phr.phr.doctype.phr_activity_log.phr_activity_log import make_log
from erpnext.setup.doctype.sms_settings.sms_settings import send_sms
from frappe.utils.email_lib import sendmail
from phr.templates.pages.dashboard import search_profile_data_from_solr


@frappe.whitelist(allow_guest=True)
def get_appointments(data):
	fields, values, tab= get_data_to_render(data)

	pos = 0
	for filed_dict in fields:
		pos =+ 1
		if 'rows' in filed_dict.keys(): 
			rows = filed_dict.get('rows')
			break
	data=json.loads(data)
	apts_list=fetch_values_from_db(data)
	for d in apts_list:
		rows.extend([[get_formatted_date_time(d.from_date_time),d.provider_name,d.reason]])

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
	if valide_date(data):
		c_medication=save_data(data)
		response=get_appointments(data)
		appointment=json.loads(data)
		sub="Appointment created with"+" "+appointment.get('provider')
		make_log(appointment.get('profile_id'),"Appointment","create",sub)
		return response
	else:
		return {'exe': "Appointment Date/Time Should not be less than Current Date/Time"}

def valide_date(data):
	obj = json.loads(data)
	from frappe.utils import time_diff_in_seconds
	
	from_date_time = datetime.datetime.strptime(obj.get('from_date_time'), '%d/%m/%Y %H:%M').strftime('%Y-%m-%d %H:%M:%S')
	curr_date_time = datetime.datetime.strptime(obj.get('curr_date_time'), '%Y-%m-%d %H:%M:%S').strftime('%Y-%m-%d %H:%M:%S')

	if time_diff_in_seconds(from_date_time, curr_date_time) < 0:
		return False
	return True

def save_data(data):
	obj=json.loads(data)
	from_date=get_formatted_date(obj.get('from_date_time'))
	user=frappe.get_doc("User",frappe.user.name)
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
		return datetime.datetime.strptime(strdate,"%d/%m/%Y %H:%M")


@frappe.whitelist(allow_guest=True)
def notify_appointments():
	profile_list = get_list_to_notify()
	send_notification(profile_list)

def send_notification(profile_list):
	print "##########Appointments#############"
	print profile_list
	if profile_list:
		email_list=[]
		sms_recipients=[]
		msg={}
		for profile in profile_list:
			user = frappe.db.get_value("User",{"profile_id":profile['profile_id']},"name")
			if user:
				pobj=frappe.get_doc('User',user)
				apobj=frappe.get_doc('Appointments',profile['name'])
				if pobj:
					if frappe.db.get_value("Mobile Verification",{"mobile_no":pobj.contact,"mflag":1},"name"):
						mob_no=[]
						mob_no.append(pobj.contact)
						msgg = get_sms_template("appointments",{"doctor_name":profile['provider_name'],"appointment_time":profile['time']})
						print msgg
						send_sms(mob_no,msg=msgg)
					
			else:
				data = search_profile_data_from_solr(profile['profile_id'])
				if data and data['mobile']:
					mob_no=[]
					mob_no.append(data['mobile'])
					send_sms(mob_no,msg=get_sms_template("appointments",{"doctor_name":profile['provider_name'],"appointment_time":profile['time']}))
		
		

def get_list_to_notify():
	profile_list=frappe.db.sql("""select profile_id,name,DATE_FORMAT(from_date_time,'%h:%i %p') as time,provider_name from 
		`tabAppointments` 
		where from_date_time 
		between  now() + INTERVAL 58 MINUTE 
		and  now() + INTERVAL 62 MINUTE""",as_dict=1)
	return profile_list

	