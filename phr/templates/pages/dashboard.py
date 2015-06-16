from __future__ import unicode_literals
import frappe
import json
from frappe.utils import cint
import datetime
from phr.templates.pages.utils import get_base_url
from phr.templates.pages.utils import get_formatted_date_time, formatted_date 

@frappe.whitelist(allow_guest=True)		
def get_linked_phrs_with_img(profile_id):
	data = get_linked_phrs(profile_id)
	if data:
		return get_lphrs_with_img(data)

@frappe.whitelist(allow_guest=True)
def get_linked_phrs(profile_id):
	solr_op = 'searchchildprofile'
	url=get_base_url()+solr_op
	request_type='POST'
	data={"to_profile_id":profile_id}
	from phr.phr.phr_api import get_response
	response=get_response(url,json.dumps(data),request_type)
	res=json.loads(response.text)
	if res['returncode']==120:
		#linked_phr_list=get_lphrs_with_img(res)
		return res

@frappe.whitelist(allow_guest=True)
def get_lphrs_with_img(data):
	linked_phr_list=[]
	for profile in data["list"]:
		from phr.templates.pages.profile import get_user_image
		user_image=get_user_image(profile["entityid"])
		linked_phr_list.append({"entityid":profile["entityid"],"person_firstname":profile["person_firstname"],"person_lastname":profile["person_lastname"],"user_image":user_image["image"],"gender":profile["gender"]})
	return linked_phr_list

@frappe.whitelist(allow_guest=True)
def get_user_details(profile_id=None):
	print profile_id
	args = {} 
	if profile_id:
		user_name = frappe.db.get_value("User", { "profile_id" : profile_id}, "name")
		print user_name
		if user_name:
			user = frappe.get_doc("User",user_name)
			args.update({
				"name":"{0} {1}".format(user.first_name,user.last_name),
				"contact":user.contact,
				"barcode":user.barcode or "",
				"user_image":user.user_image or "",
				"emergency_contact":user.emergemcy_contactno or "",
				"blood_group":user.blood_group or "",
				"profile_id":profile_id
			})
		else:
			data = search_profile_data_from_solr(profile_id)
			child = data['childProfile']
			barcode = frappe.db.get_value("LinkedPHR Images",{"profile_id":profile_id},"barcode")
			user_image = frappe.db.get_value("LinkedPHR Images",{"profile_id":profile_id},"profile_image")  
			args.update({
				"name":"{0} {1}".format(child["person_firstname"],child["person_lastname"]),
				"contact":child["mobile"],
				"barcode":barcode or "",
				"user_image":user_image or "",
				"emergency_contact":child["emergemcy_contactno"] or "",
				"blood_group":child["blod_group"] or "",
				"profile_id":profile_id
			})

	return args

@frappe.whitelist(allow_guest=True)
def search_profile_data_from_solr(profile_id):
	solr_op = 'admin/searchlinkprofile'
	url = get_base_url()+solr_op
	request_type = 'POST'
	data = {"from_profile_id":profile_id}
	from phr.phr.phr_api import get_response
	response = get_response(url,json.dumps(data),request_type)
	res = json.loads(response.text)
	if res['returncode'] == 120:
		return res['list'][0]

@frappe.whitelist(allow_guest=True)
def get_data_for_middle_section(profile_id):
	print "###############################"
	print frappe._dict()
	db_list = get_enabled_dashboard(profile_id)
	if db_list:
		obj = db_list[0]
		res_list = []
		if obj.get('disease_monitoring')==1:
			data = get_diseases()
			if data:
				res_list = build_dm_data(data,res_list)

		if obj.get('visits') == 1 or obj.get('events') == 1:
			data = get_data_from_solr(profile_id)
			#if data:
			res_list = build_response(data,obj,res_list,profile_id) 
		
		if obj.get('appointments') == 1:
			data = get_appointments(profile_id)
			res_list = build_response_for_appointments(data,obj,res_list)
		
		if obj.get('medications') == 1:
			data = get_medications(profile_id)
			res_list = build_response_for_medications(data,obj,res_list)

		if obj.get('messages') == 1:
			data = get_logs(profile_id)
			res_list = build_response_for_logs(data,obj,res_list)		

		return {
				"res_list":res_list,
				"rtcode":1
			}
	else:
		return
		{
			"message":"Please Setup Dashboard",
			"rtcode":0
		}

@frappe.whitelist(allow_guest=True)
def get_enabled_dashboard(profile_id):
	return frappe.db.sql("""select * from `tabShortcut` where profile_id='%s'"""%(profile_id),as_dict=1)

@frappe.whitelist(allow_guest=True)
def get_diseases():
	return frappe.db.sql("""select disease_name,event_master_id 
		from `tabDisease Monitoring`""",as_dict=1)

def build_dm_data(data,res_list):
	options=[]
	for d in data:
		dic={"option":d["disease_name"],"id":d["event_master_id"]}
		options.append(dic)
	dm_dic={"fieldname":"disease_monitoring","fieldtype": "table","label": "Disease Monitoring","options":options}
	res_list.append(dm_dic)

	return res_list

@frappe.whitelist(allow_guest=True)
def get_data_from_solr(profile_id):
	solr_op='getlatesteventvisitlistbyprofileid'
	url=get_base_url()+solr_op
	request_type='POST'
	data={"profileId":profile_id,"rowCountLimit":5}
	from phr.phr.phr_api import get_response
	response=get_response(url,json.dumps(data),request_type)
	res=json.loads(response.text)
	if res['returncode']==105:
		return res['actualdata']

def build_response(data,obj,res_list,profile_id):
	if obj.get('visits')==1:
		visit_data = build_visit_data(data)
		res_list.append(visit_data)
	if obj.get('events')==1:
		event_data=build_event_data(data,profile_id)
		res_list.append(event_data)
	return res_list

def build_visit_data(obj):
	rows=[
    	[
     		"Date", 
     		"Visit Description", 
     		"Provider's Name"
    	]
   ]
	if obj:
		data=json.loads(obj)
		if (data["visitList"]):
			for d in data["visitList"]:
				rows.extend([[d["str_visit_date"],d["visit_descripton"],d["doctor_name"]]])
		else:
			rows.extend([["NO DATA","",""]])
	else:
		rows.extend([["NO DATA","",""]])

	visit_dic={"fieldname":"visits","fieldtype": "table","label": "Visits","rows":rows}
	return visit_dic

def build_event_data(obj,profile_id):
	rows=[
    	[
     		"Event Name", 
     		"Date", 
     		"Complaints", 
     		"Diagnosis"
    	]
   ]	
   #datetime.datetime.fromtimestamp(cint(visit['event_date'])/1000.0)
	if obj:
		data=json.loads(obj)
		if data and data["eventList"]:
			for d in data["eventList"]:
				rows.extend([["""<a nohref id="%(entityid)s" onclick="Events.prototype.open_form('%(entityid)s', '%(event_title)s', '%(profile_id)s')"> %(event_title)s </a>"""%{"entityid": d['entityid'],"event_title": d['event_title'], "profile_id":profile_id},datetime.datetime.fromtimestamp(cint(d["event_date"])/1000.0).strftime('%d/%m/%Y'), ', '.join(d["event_symptoms"]), d["diagnosis_desc"]]])
		else:
			rows.extend([["	NO DATA","","",""]])
	else:
		rows.extend([["	NO DATA","","",""]])

	event_dic={"fieldname":"events","fieldtype": "table","label": "Events","rows":rows}
	return event_dic

@frappe.whitelist(allow_guest=True)
def get_medications(profile_id):
	return frappe.db.sql("""select * from 
		`tabMedication` where profile_id='%s' 
		order by creation desc limit 5"""%(profile_id),as_dict=1)

def build_response_for_medications(data,obj,res_list):
	medication_data = build_medication_data(data)
	res_list.append(medication_data)
	return res_list

def build_medication_data(data):
	rows=[
    	[
     		"Medicine Name", 
     		"Dosage", 
     		"From Date", 
     		"To Date",
     		"Addn Info",
     		"Status"
    	]
   ]	
	if (data):
		for d in data:
			rows.extend([[d["medicine_name"],d["dosage"],formatted_date(d["from_date_time"]),formatted_date(d["to_date_time"]),d["additional_info"], d['status']]])
	else:
		rows.extend([[" NO DATA","","","",""]])		
	
	medication_dic={"fieldname":"medications","fieldtype": "table","label": "Medications","rows":rows}
	return medication_dic

@frappe.whitelist(allow_guest=True)
def get_appointments(profile_id):
	return frappe.db.sql("""select * from 
		`tabAppointments` where profile_id='%s' 
		order by creation desc limit 5"""%(profile_id),as_dict=1)
	
def build_response_for_appointments(data,obj,res_list):
	appointments_data=build_appointments_data(data)	
	res_list.append(appointments_data)
	return res_list

def build_appointments_data(data):
	rows=[
    	[
     		"Date Time", 
     		"Providers Name", 
     		"Reason For Visit", 
    	]
   ]	
	if (data):
		for d in data:
			rows.extend([[get_formatted_date_time(d["from_date_time"]),d["provider_name"],d["reason"]]])
	else:
		rows.extend([["NO DATA", "",""]])
	appointments_dic={"fieldname":"appointments","fieldtype": "table","label": "Appointments","rows":rows}
	return appointments_dic

def build_response_for_logs(data,obj,res_list):
	logs_data=build_logs_data(data)
	res_list.append(logs_data)
	return res_list

def build_logs_data(data):
	rows=[
    	[
     		"Entity", 
     		"Operation", 
     		"Description" 
       	]
   ]	
	if (data):
		for d in data:
			rows.extend([[d["entity"],d["operation"],d["subject"]]])
	else:
		rows.extend([["NO DATA", "",""]])

	logs_dic={"fieldname":"messages","fieldtype": "table","label": "Shared History","rows":rows}
	return logs_dic

@frappe.whitelist(allow_guest=True)
def get_advertisements(profile_id=None):
	ad_list=frappe.db.sql("""select * from `tabAdvertisements` 
		where status='Active' 
		order by creation limit 5""",as_dict=1)
	if ad_list:
		return {
			"ad_list":ad_list,
			"rtcode":1
		}
	else:
		return {
			"Message":"No data",
			"rtcode":1
		}

@frappe.whitelist(allow_guest=True)
def get_logs(profile_id):
	log_list=frappe.db.sql("""select * from 
		`tabPHR Activity Log` 
		where profile_id='%s' and entity in ('Event','Visit') order by creation desc limit 5"""%(profile_id),as_dict=1)
	return log_list
