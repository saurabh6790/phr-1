
from __future__ import unicode_literals
import frappe
from frappe.core.doctype.user.user import STANDARD_USERS
from frappe.utils import cint
import json
import requests
import os
from frappe.auth import _update_password
from frappe import _
import binascii
import base64
from phr.templates.pages.login import create_profile_in_db,get_barcode,get_image_path
from phr.templates.pages.patient import get_base_url
from frappe.utils import cint, now, get_gravatar,cstr
from phr.phr.doctype.phr_activity_log.phr_activity_log import make_log
import datetime
from phr.templates.pages.patient import get_base_url 
from erpnext.setup.doctype.sms_settings.sms_settings import send_sms
from frappe.utils.email_lib import sendmail


@frappe.whitelist(allow_guest=True)
def update_profile(data,id,dashboard=None):
	call_mapper={
	"basic_info":update_profile_solr,
	"password":update_password,
	"update_phr":manage_phr,
	"dashboard":manage_dashboard,
	"notification":manage_notifications}
	method=call_mapper.get(id)
	response=method(data,dashboard)
	return response

@frappe.whitelist(allow_guest=True)
def update_profile_solr(data,dashboard=None):
	request_type="POST"
	#url="http://88.198.52.49:7974/phr-api/updateProfile"
	url=get_base_url()+"/updateProfile"
	from phr.phr.phr_api import get_response
	response=get_response(url,data,request_type)
	res=json.loads(response.text)
	print res['returncode']
	p=json.loads(data)
	if res['returncode']==102:
		sub="Profile Updated Successfully"
		make_log(p.get('entityid'),"profile","update",sub)
		update_user_details(p)
		return "Profile Updated Successfully"
	else:
		frappe.errprint(res)
		return "Error While Updating Profile"
		
def update_user_details(data):
	frappe.db.sql("""update `tabUser` set 
		first_name='%s',
		middle_name='%s',
		last_name='%s',
		contact='%s' 
		where profile_id='%s'"""%(data.get('person_firstname'),data.get('person_middlename'),data.get('person_lastname'),data.get('mobile'),data.get('entityid')))


@frappe.whitelist(allow_guest=True)
def update_password(data,dashboard=None):
	usrobj=json.loads(data)
	old_password=usrobj.get('old_password')
	new_password=usrobj.get('new_password')
	user=frappe.db.get_value("User",{"profile_id":usrobj.get('entityid')})
	print [user,old_password,new_password]
	if not new_password:
		return _("Cannot Update: Please Enter Valid Password")
	if old_password:
		if not frappe.db.sql("""select user from __Auth where password=password(%s)
			and user=%s""", (old_password, user)):
			return "Cannot Update: Incorrect Password"
	_update_password(user, new_password)
	sub="Password Updated Successfully"
	make_log(usrobj.get('entityid'),"profile","update Password",sub)
	return "Password Updated Successfully"

@frappe.whitelist(allow_guest=True)
def manage_phr(data,dashboard=None):
	frappe.errprint(data)

@frappe.whitelist(allow_guest=True)
def manage_notifications(data,dashboard=None):
	obj=json.loads(data)
	dashboard_fields=json.loads(dashboard)
	mn=frappe.db.get_value("Notification Configuration",{"profile_id":obj.get('entityid')},"name")
	if mn:
		frappe.db.sql("""update `tabNotification Configuration` set linked_phr=0,to_do=0 where name='%s'"""%(mn))
		update_values_notify(dashboard_fields,mn,obj.get('entityid'))
		sub="Notifications Configuration Done"
		make_log(obj.get('entityid'),"profile","Notifications",sub)
		return "Notification Settings Updated"
	else:
		mn = frappe.get_doc({
			"doctype":"Notification Configuration",
			"profile_id":obj.get('entityid'),
			"created_via": "Web"
		})
		mn.ignore_permissions = True
		mn.insert()
		update_values_notify(dashboard_fields,mn.name,obj.get('entityid'))
		sub="Notifications Configuration Done"
		make_log(obj.get('entityid'),"profile","Notifications",sub)
		return "Notification Settings Done"
	
def update_values_notify(dashboard_fields,name,profile_id):
	for d in dashboard_fields:
		frappe.db.sql("""update `tabNotification Configuration` set %s=1 where name='%s'"""%(d,name))
		frappe.db.commit()
		sub="Notifications Configuration Done"
		make_log(profile_id,"profile","Notifications",sub)

@frappe.whitelist(allow_guest=True)
def manage_dashboard(data,dashboard=None):
	obj=json.loads(data)
	dashboard_fields=json.loads(dashboard)
	sr=frappe.db.get_value("Shortcut",{"profile_id":obj.get('entityid')},"name")
	if sr:
		frappe.db.sql("""update `tabShortcut` set 
			visits=0,events=0,
			medications=0,disease_monitoring=0, 
			appointments=0,messages=0  
			where name='%s'"""%(sr))
		update_values(dashboard_fields,sr,obj.get('entityid'))
		sub="Dashboard Configuration Done"
		make_log(obj.get('entityid'),"profile","Dashboard",sub)
		return "Dashboard Configuration Updated"
	else:
		sr = frappe.get_doc({
			"doctype":"Shortcut",
			"profile_id":obj.get('entityid'),	
			"created_via": "Web"
		})
		sr.ignore_permissions = True
		sr.insert()
		update_values(dashboard_fields,sr.name,obj.get('entityid'))
		sub="Dashboard Configuration Done"
		make_log(obj.get('entityid'),"profile","Dashboard",sub)
		return "Dashboard Configuration Done"

def update_values(fields,name,profile_id):
	for d in fields:
		frappe.db.sql("""update `tabShortcut` set %s=1 where name='%s'"""%(d,name))
		frappe.db.commit()
		

@frappe.whitelist(allow_guest=True)
def get_user_image(profile_id):
	upexists=frappe.db.get_value("User",{"profile_id":profile_id},"user_image")
	if upexists:
		return {
			"image":upexists
		}
	else:
		up=frappe.db.get_value("LinkedPHR Images",{"profile_id":profile_id},"profile_image")
		if up:
			return{
				"image":up	
			}





@frappe.whitelist(allow_guest=True)
def upload_image(profile_id,data=None):
	from binascii import a2b_base64
	import base64
	data_index = data.index('base64') + 7
	filedata = data[data_index:len(data)]
	decoded_image = base64.b64decode(filedata)
	site_name = get_site_name()
	path = os.path.abspath(os.path.join('.',site_name, 'public', 'files'))
	image=path+'/'+profile_id+".jpg"
	file_path='/files/'+profile_id+".jpg"
	if os.path.exists(image):
		try:
			os.remove(image)
			fd = open(image, 'wb')
			fd.write(decoded_image)
			fd.close()
			update_user_image(file_path,profile_id)
			return "Profile Image Updated"
		except OSError, e:
			print ("Error: %s - %s." % (e.filename,e.strerror))
	else:
		fd = open(image, 'wb')
		fd.write(decoded_image)
		fd.close()
		update_user_image(file_path,profile_id)
		return "Profile Image Uploaded Successfully"

def update_user_image(path,profile_id):
	ue=frappe.db.get_value("User",{"profile_id":profile_id},"user_image")
	if ue:
		user=frappe.get_doc("User",frappe.session.user)
		user.user_image=path
		user.save(ignore_permissions=True)
		sub="Image Uploaded Successfully "+path
		make_log(profile_id,"profile","Image Upload",sub)
		return "Image Uploaded Successfully"
	else:
		cie=frappe.db.get_value("LinkedPHR Images",{"profile_id":profile_id},"profile_image")
		if cie:
			frappe.db.sql("""update `tabLinkedPHR Images` 
				set profile_image='%s' where profile_id='%s'"""%(path,profile_id))
			frappe.db.commit()
			sub="Image Uploaded Successfully "+path
			make_log(profile_id,"profile","Linked PHR Image Upload",sub)
			return "Image Uploaded Successfully"
		else:
			lp=frappe.new_doc("LinkedPHR Images")
			lp.profile_id=profile_id
			lp.profile_image=path
			lp.save(ignore_permissions=True)
			sub="Image Uploaded Successfully "+path
			make_log(profile_id,"profile","Linked PHR Image Upload",sub)
			return "Image Uploaded Successfully"




def get_site_name():
	return frappe.local.site_path.split('/')[1]

@frappe.whitelist(allow_guest=True)
def get_linked_phrs(profile_id):
	from phr.templates.pages.patient import get_base_url
	solr_op='phrdata/searchchildphr'
	url=get_base_url()+solr_op
	#url="http://192.168.5.11:9090/phr/phrdata/searchchildphr"
	request_type='POST'
	data={"to_profile_id":profile_id}
	from phr.phr.phr_api import get_response
	response=get_response(url,json.dumps(data),request_type)
	res=json.loads(response.text)
	print res
	if res['returncode']==106:
		return res

@frappe.whitelist(allow_guest=True)
def delink_phr(selected,data,profile_id=None):
	obj=json.loads(data)
	ids=json.loads(selected)
	print obj
	print ids
	if ids:
		for id in ids:
	 		print obj[id]
			ret_res=delink_phr_solr(obj[id],id,profile_id)
			print ret_res
		l_phrs=get_linked_phrs(profile_id)
		print l_phrs
		return {
			"message":"Profile Delinked Successfully",
			"res":l_phrs
		}
	else:
		return {
			"message":"Please Select PHR to Delink"
		}
def delink_phr_solr(data,id,profile_id):
	solr_op='unlinkProfile'
	url=get_base_url()+solr_op
	request_type='POST'
	barcode=get_barcode()
	#jsonobj=json.loads(data)
	data["recieved_from"]="Desktop"
	#data["barcode"]=str(barcode)
	jsonobj={"entityid":id,"linking_id":profile_id,"received_from":"Desktop"}
	from phr.phr.phr_api import get_response
	response=get_response(url,json.dumps(jsonobj),request_type)
	res=json.loads(response.text)
	print res
	if res['returncode']==121:
		path=get_image_path(barcode,res['entityid'])
		print res
		actdata=res['actualdata']		
		dt=json.loads(actdata)
		#sub=dt['person_firstname']+" "+dt['person_lastname']+" "+"delinked Successfully"
		#make_log(profile_id,"profile","delink",sub)
		args={'person_firstname':dt['person_firstname'],'person_middlename':dt['person_middlename'],'person_lastname':dt['person_lastname'],'email':dt['email'],'mobile':dt['mobile'],'received_from':'Desktop','provider':'false','barcode':str(barcode)}
		#ret_res=create_profile_in_db(res['entityid'],args,res,path)
		ret_res=''
		#sub=dt['person_firstname']+" "+dt['person_lastname']+" "+"Profile Created Successfully"
		#make_log(profile_id,"profile","create",sub)
		return ret_res


@frappe.whitelist(allow_guest=True)
def get_enabled_notification(profile_id):
	ret=frappe.db.sql("""select linked_phr,to_do 
		from `tabNotification Configuration` 
		where profile_id='%s'"""%(profile_id),as_dict=1)
	return ret

@frappe.whitelist(allow_guest=True)
def get_enabled_dashboard(profile_id):
	return frappe.db.sql("""select * from `tabShortcut` where profile_id='%s'"""%(profile_id),as_dict=1)


@frappe.whitelist(allow_guest=True)
def get_data_for_middle_section(profile_id):
	db_list=get_enabled_dashboard(profile_id)
	if db_list:
		obj=db_list[0]
		res_list=[]
		if obj.get('disease_monitoring')==1:
			data=get_diseases()
			if data:
				res_list=build_dm_data(data,res_list)
		if obj.get('visits')==1 or obj.get('events')==1:
			data=get_data_from_solr(profile_id)
			#if data:
			res_list=build_response(data,obj,res_list) 
		if obj.get('appointments')==1:
			data=get_appointments(profile_id)
			res_list=build_response_for_appointments(data,obj,res_list)
		if obj.get('medications')==1:
			data=get_medications(profile_id)
			res_list=build_response_for_medications(data,obj,res_list)

		if obj.get('messages')==1:
			data=get_logs(profile_id)
			res_list=build_response_for_logs(data,obj,res_list)		

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


		# if obj.get('disease_monitoring')==1:
		# 	data=get_data_from_db(profile_id)
		# 	if data:
		# 		res_list=build_response(data,obj,res_list)
@frappe.whitelist(allow_guest=True)
def get_logs(profile_id):
	log_list=frappe.db.sql("""select * from 
		`tabPHR Activity Log` 
		where profile_id='%s' and entity in ('Event','Visit') order by creation desc limit 5"""%(profile_id),as_dict=1)
	return log_list

@frappe.whitelist(allow_guest=True)
def get_diseases():
	return frappe.db.sql("""select disease_name,event_master_id 
		from `tabDisease Monitoring`""",as_dict=1)



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
		#frappe.errprint(res['actualdata'])
		return res['actualdata']

@frappe.whitelist(allow_guest=True)
def get_appointments(profile_id):
	return frappe.db.sql("""select * from 
		`tabAppointments` where profile_id='%s' 
		order by creation desc limit 5"""%(profile_id),as_dict=1)

@frappe.whitelist(allow_guest=True)
def get_medications(profile_id):
	return frappe.db.sql("""select * from 
		`tabMedication` where profile_id='%s' 
		order by creation desc limit 5"""%(profile_id),as_dict=1)


def build_response(data,obj,res_list):
	if obj.get('visits')==1:
		visit_data=build_visit_data(data)
		res_list.append(visit_data)
	if obj.get('events')==1:
		event_data=build_event_data(data)
		res_list.append(event_data)
	return res_list

def build_response_for_medications(data,obj,res_list):
	medication_data=build_medication_data(data)
	res_list.append(medication_data)
	return res_list
	
def build_response_for_appointments(data,obj,res_list):
	appointments_data=build_appointments_data(data)	
	res_list.append(appointments_data)
	return res_list

def build_response_for_logs(data,obj,res_list):
	logs_data=build_logs_data(data)
	res_list.append(logs_data)
	return res_list

def build_dm_data(data,res_list):
	options=[]
	for d in data:
		dic={"option":d["disease_name"],"id":d["event_master_id"]}
		options.append(dic)
	dm_dic={"fieldname":"disease_monitoring","fieldtype": "table","label": "Disease Monitoring","options":options}
	res_list.append(dm_dic)	
	return res_list

def build_visit_data(obj):
	rows=[
    	[
     		"Date", 
     		"visit description", 
     		"Provider's Name"
    	]
   ]
	if obj:
		data=json.loads(obj)
		if (data["visitList"]):
			for d in data["visitList"]:
				rows.extend([[d["str_visit_date"],d["visit_descripton"],d["doctor_name"]]])
	else:
		rows.extend([["","NO DATA",""]])
	visit_dic={"fieldname":"visits","fieldtype": "table","label": "Visits","rows":rows}
	return visit_dic

def build_event_data(obj):
	rows=[
    	[
     		"Event Name", 
     		"Date", 
     		"Complaints", 
     		"Complaints Desc"
    	]
   ]	
   #datetime.datetime.fromtimestamp(cint(visit['event_date'])/1000.0)
   	if obj:
		data=json.loads(obj)
		if data and data["eventList"]:
			for d in data["eventList"]:
				rows.extend([[d["event_title"],datetime.datetime.fromtimestamp(cint(d["event_date"])/1000.0),d["event_symptoms"],d["diagnosis_desc"]]])
	else:
		rows.extend([["","NO DATA","",""]])		
	event_dic={"fieldname":"events","fieldtype": "table","label": "Events","rows":rows}
	return event_dic

def build_medication_data(data):
	rows=[
    	[
     		"Medicine Name", 
     		"Dosage", 
     		"From Date", 
     		"To Date",
     		"Addn Info"
    	]
   ]	
	if (data):
		for d in data:
			rows.extend([[d["medicine_name"],d["dosage"],d["from_date_time"],d["to_date_time"],d["additional_info"]]])
	else:
		rows.extend([[" NO DATA","","","",""]])		
	
	medication_dic={"fieldname":"medications","fieldtype": "table","label": "Medications","rows":rows}
	return medication_dic

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
			rows.extend([[d["from_date_time"],d["provider_name"],d["reason"]]])
	else:
		rows.extend([["","NO DATA",""]])
	appointments_dic={"fieldname":"appointments","fieldtype": "table","label": "Appointments","rows":rows}
	return appointments_dic

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
		rows.extend([["","NO","DATA"]])

	logs_dic={"fieldname":"messages","fieldtype": "table","label": "Messages","rows":rows}
	return logs_dic


@frappe.whitelist(allow_guest=True)
def get_user_details(profile_id=None):
	user=frappe.get_doc("User",frappe.session.user)
	if user:
		name=user.first_name+''+cstr(user.last_name)
		contact=user.contact
		barcode=user.barcode
		return{
			"name":name,
			"contact":contact,
			"barcode":barcode
		}


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
def get_states():
	states=frappe.db.sql("""select name from `tabState`""",as_list=1)
	return states



@frappe.whitelist(allow_guest=True)
def notify_about_registration():
	mobile_nos=get_mobile_nos()
	if mobile_nos:
		send_sms(mobile_nos,msg='Please Complete Your PHR Registration')
		
def get_mobile_nos():
	nos=frappe.db.sql_list("""select contact from 
		`tabUser` where 
		profile_id in (SELECT profile_id 
			FROM `tabVerification Details` 
			WHERE creation > (NOW() - INTERVAL 2 DAY) 
			and mflag=0)""")

	return nos


@frappe.whitelist(allow_guest=True)
def notify_about_linked_phrs(profile_id,email_msg=None,text_msg=None,entity=None):
	linked_phr=("""select profile_id from `tabNotification Configuration` where linked_phr=1""")
	if linked_phr:
		user=frappe.get_doc('User',frappe.db.get_value("User",{"profile_id":profile_id},"name"))
		if user:
			sendmail(user.name,subject="PHR Updates:"+entity+"Updated",msg=email_msg)
			rec_list=[]
			rec_list.append(user.contact)
			send_sms(rec_list,msg=text_msg)
		else:
			get_profile_data_from_solr(profile_id)

@frappe.whitelist(allow_guest=True)
def get_profile_data_from_solr(profile_id):
	solr_op='admin/searchlinkprofile'
	url=get_base_url()+solr_op
	request_type='POST'
	data={"profileId":profile_id}
	from phr.phr.phr_api import get_response
	response=get_response(url,json.dumps(data),request_type)
	res=json.loads(response.text)
	if res['returncode']==120:
		return res['list']

@frappe.whitelist(allow_guest=True)
def search_profile_data_from_solr(profile_id):
	solr_op='admin/searchlinkprofile'
	url=get_base_url()+solr_op
	request_type='POST'
	data={"entityid":profile_id}
	from phr.phr.phr_api import get_response
	response=get_response(url,json.dumps(data),request_type)
	res=json.loads(response.text)
	if res['returncode']==120:
		return res['actualdata'][0]
