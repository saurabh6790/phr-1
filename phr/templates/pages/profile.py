
from __future__ import unicode_literals
import frappe
from frappe.core.doctype.user.user import STANDARD_USERS
from frappe.utils import cint
import json
import requests
import os
from frappe.auth import _update_password
from frappe import _,msgprint
import binascii
import base64
from phr.templates.pages.login import create_profile_in_db,get_barcode,get_image_path,get_mob_code
from frappe.utils import cint, now, get_gravatar,cstr,get_site_path,get_url, get_files_path
from phr.phr.doctype.phr_activity_log.phr_activity_log import make_log
import datetime
from phr.templates.pages.utils import get_base_url, send_phrs_mail, get_formatted_date_time, formatted_date, get_sms_template 
from phr.templates.pages.form_generator import get_data_to_render
from erpnext.setup.doctype.sms_settings.sms_settings import send_sms
import requests
from frappe.utils.email_lib import sendmail

@frappe.whitelist(allow_guest=True)
def update_profile(data,id,dashboard=None):
	call_mapper = {
	"basic_info":update_profile_solr,
	"password":update_password,
	"update_phr":manage_phr,
	"dashboard":manage_dashboard,
	"notification":manage_notifications}
	method = call_mapper.get(id)
	response = method(data,dashboard)
	return response

@frappe.whitelist(allow_guest=True)
def update_profile_solr(data,dashboard=None):
	request_type = "POST"
	user_details = json.loads(data)
	if 	not_duplicate_contact(user_details.get('mobile'),user_details.get('email')):
		url = get_base_url()+"/updateProfile"
		from phr.phr.phr_api import get_response
		response = get_response(url,data,request_type)
		res = json.loads(response.text)
		profile = json.loads(data)
		if res['returncode']==102:
			sub = "Profile Updated Successfully"
			make_log(profile.get('entityid'),"profile","update",sub)
			update_user_details(profile)
			mob_code = make_mv_entry(user_details.get('mobile'),profile.get('entityid'))
			return {"rtcode":100,"msg":"Profile Updated Successfully","mob_no":user_details.get('mobile'),"user":user_details.get('email'),"mobile_code":mob_code}
		else:
			return {"rtcode":101,"msg":"Error While Updating Profile"}
	else:
		return {"rtcode":201,"msg":"Maintioned contact number is already registered with another profile."}

@frappe.whitelist(allow_guest=True)
def make_mv_entry(mobile,profile_id):
	mob_v = frappe.db.get_value("Mobile Verification",{"mobile_no":mobile},"name")
	mobile_code = get_mob_code()
	if not mob_v:
		make_mobile_verification_entry(mobile,profile_id,mobile_code)
		return mobile_code
	elif mob_v and not frappe.db.get_value("Mobile Verification",{"mobile_no":mobile,"profile_id":profile_id},"name"):
		edit_mobile_verification_entry(mobile,profile_id,mobile_code,mob_v)
		return mobile_code

		
@frappe.whitelist(allow_guest=True)
def not_duplicate_contact(mobile,user):
	if frappe.db.sql("""select count(*) from tabUser 
		where contact = '%s' and name != "%s"
	"""%(mobile,user), as_list=1,debug=1)[0][0] == 0:
		return True
	else:
		return False

@frappe.whitelist(allow_guest=True)
def verify_code(data,mobile):
	res = json.loads(data)
	verification_code = frappe.db.get_value("Mobile Verification",mobile,"verification_code")
	if not verification_code == res.get('code'):
		return {"returncode":0,"message":"Code Invalid"}
	else:
		mv = frappe.get_doc('Mobile Verification',mobile)
		mv.mflag = 1
		mv.save(ignore_permissions=True)
		return {"returncode":1,"message":"Mobile No verified"}

@frappe.whitelist(allow_guest=True)
def check_contact_verified(mobile):
	mob_verified = frappe.db.get_value("Mobile Verification",{"mobile_no":mobile},"mflag")
	if mob_verified == 1:
		return True
	else:
		return False


	
@frappe.whitelist(allow_guest=True)
def send_mobile_v_code(mobile,profile_id,mobile_code=None):
	if mobile_code:
		from phr.templates.pages.utils import get_sms_template
		sms = get_sms_template("registration",{ "mobile_code": mobile_code })
		rec_list = []
		rec_list.append(mobile)
		from erpnext.setup.doctype.sms_settings.sms_settings import send_sms
		send_sms(rec_list,sms)
		return "done"

def make_mobile_verification_entry(mobile,profile_id,mobile_code):
	mv = frappe.get_doc({
		"doctype":"Mobile Verification",
		"profile_id":profile_id,
		"mobile_no":mobile,
		"verification_code":mobile_code
	})
	mv.ignore_permissions = True
	mv.insert()
	return mv.name

def edit_mobile_verification_entry(mobile,profile_id,mobile_code,name):
	mv = frappe.get_doc("Mobile Verification",name)
	mv.profile_id = profile_id
	mv.mflag = 0
	mv.verification_code = mobile_code
	mv.save(ignore_permissions=True)

def update_user_details(data):
	frappe.db.sql("""update `tabUser` set 
		first_name='%s',
		middle_name='%s',
		last_name='%s',
		contact='%s',
		blood_group='%s',
		emergemcy_contactno='%s' 
		where profile_id='%s'"""%(data.get('person_firstname'),data.get('person_middlename'),data.get('person_lastname'),data.get('mobile'),data.get('blod_group'),data.get('emergemcy_contactno'),data.get('entityid')))
	frappe.db.commit()	

@frappe.whitelist(allow_guest=True)
def update_password(data,dashboard=None):
	usrobj = json.loads(data)
	old_password = usrobj.get('old_password')
	new_password = usrobj.get('new_password')

	if new_password != usrobj.get('cnf_new_password'):
		return " Cannot Update: New Password and Confirm Password fields are not matching "

	user = frappe.db.get_value("User",{"profile_id":usrobj.get('entityid')})
	
	if not new_password:
		return _("Cannot Update: Please Enter Valid Password")

	if old_password:
		if not frappe.db.sql("""select user from __Auth where password=password(%s)
			and user=%s""", (old_password, user)):
			return "Cannot Update: Old Password is Incorrect"
	_update_password(user, new_password)
	frappe.db.set_value("User",user,"password_str",new_password)
	sub = "Password Updated Successfully"
	make_log(usrobj.get('entityid'),"profile","update Password",sub)
	return "Password Updated Successfully"

@frappe.whitelist(allow_guest=True)
def manage_phr(data,dashboard=None):
	pass

@frappe.whitelist(allow_guest=True)
def manage_notifications(data,dashboard=None):
	obj = json.loads(data)
	dashboard_fields = json.loads(dashboard)
	mn = frappe.db.get_value("Notification Configuration",{"profile_id":obj.get('entityid')},"name")
	if mn:
		frappe.db.sql("""update `tabNotification Configuration` set linked_phr=0,to_do=0 where name='%s'"""%(mn))
		update_values_notify(dashboard_fields,mn,obj.get('entityid'))
		sub = "Notifications Configuration Done"
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
		sub = "Notifications Configuration Done"
		make_log(obj.get('entityid'),"profile","Notifications",sub)
		return "Notification Settings Done"
	
def update_values_notify(dashboard_fields,name,profile_id):
	for d in dashboard_fields:
		frappe.db.sql("""update `tabNotification Configuration` set %s=1 where name='%s'"""%(d,name))
		frappe.db.commit()
		sub = "Notifications Configuration Done"
		make_log(profile_id,"profile","Notifications",sub)

@frappe.whitelist(allow_guest=True)
def manage_dashboard(data,dashboard=None):
	obj = json.loads(data)
	dashboard_fields = json.loads(dashboard)
	sr = frappe.db.get_value("Shortcut",{"profile_id":obj.get('entityid')},"name")
	if sr:
		frappe.db.sql("""update `tabShortcut` set 
			visits=0,events=0,
			medications=0,disease_monitoring=0, 
			appointments=0,messages=0  
			where name='%s'"""%(sr))
		update_values(dashboard_fields,sr,obj.get('entityid'))
		sub = "Dashboard Configuration Done"
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
		sub = "Dashboard Configuration Done"
		make_log(obj.get('entityid'),"profile","Dashboard",sub)
		return "Dashboard Configuration Done"

def update_values(fields,name,profile_id):
	for d in fields:
		frappe.db.sql("""update `tabShortcut` set %s=1 where name='%s'"""%(d,name))
		frappe.db.commit()
		
@frappe.whitelist(allow_guest=True)
def get_user_image(profile_id):
	upexists = frappe.db.get_value("User",{"profile_id":profile_id},"user_image")
	if upexists:
		return {
			"image":upexists
		}
	else:
		up = frappe.db.get_value("LinkedPHR Images",{"profile_id":profile_id},"profile_image")
		if up:
			return{
				"image":up	
			}
		else:
			return{
				"image":get_gravatar(profile_id)	
			}

@frappe.whitelist(allow_guest=True)
def upload_image(profile_id,data=None,file_name=None):
	from binascii import a2b_base64
	import base64
	file_path = '/files/'+profile_id+'/'+file_name
	update_user_image(file_path, profile_id)

def update_user_image(path, profile_id):
	ue = frappe.db.get_value("User",{"profile_id":profile_id},"user_image")
	if ue:
		user = frappe.get_doc("User",frappe.session.user)
		user.user_image = path
		user.save(ignore_permissions=True)
		sub = "Image Uploaded Successfully "+path
		make_log(profile_id,"profile","Image Upload",sub)
		frappe.local.cookie_manager.set_cookie("user_image", path or "")
	else:
		cie = frappe.db.get_value("LinkedPHR Images",{"profile_id":profile_id},"profile_image")
		if cie:
			frappe.db.sql("""update `tabLinkedPHR Images` 
				set profile_image='%s' where profile_id='%s'"""%(path,profile_id))
			frappe.db.commit()
			sub = "Image Uploaded Successfully "+path
			make_log(profile_id,"profile","Linked PHR Image Upload",sub)
		else:
			lp = frappe.new_doc("LinkedPHR Images")
			lp.profile_id = profile_id
			lp.profile_image = path
			lp.save(ignore_permissions=True)
			sub = "Image Uploaded Successfully "+path
			make_log(profile_id,"profile","Linked PHR Image Upload",sub)

def get_site_name():
	return frappe.local.site_path.split('/')[1]

@frappe.whitelist(allow_guest=True)
def delink_phr(selected,data,profile_id,res):
	obj = json.loads(data)
	id = selected
	if id:
		ret_res = delink_phr_solr(obj[id],id,profile_id,res)
		return {
			"message":"Profile Delinked Successfully",
			"response":ret_res
		}
	else:
		return {
			"message":"Please Select PHR to Delink"
		}

def delink_phr_solr(data,id,profile_id,res):
	args = json.loads(res)
	solr_op = 'unlinkProfile'
	url = get_base_url()+solr_op
	request_type = 'POST'
	data["recieved_from"] = "Desktop"
	jsonobj = {"entityid":id,"linking_id":profile_id,"received_from":"Desktop","mobile":args["mobile"],"email":args["email"]}
	from phr.phr.phr_api import get_response
	response = get_response(url,json.dumps(jsonobj),request_type)
	res = json.loads(response.text)
	if res['returncode']==121:
		return res

@frappe.whitelist(allow_guest=True)
def add_profile_to_db(data,profile_id):
	res = json.loads(data)
	actdata = res['actualdata']		
	dt = json.loads(actdata)
	sub = dt['person_firstname']+" "+dt['person_lastname']+" "+"delinked Successfully"
	make_log(profile_id,"profile","delink",sub)
	args = {'person_firstname':dt['person_firstname'],'person_middlename':dt['person_middlename'],'person_lastname':dt['person_lastname'],'email':dt['email'],'mobile':dt['mobile'],'received_from':'Desktop','provider':'false'}
	
	cie = frappe.db.get_value("LinkedPHR Images",{"profile_id":res['entityid']}, ["barcode", "profile_image"], as_dict=1)

	path = ""
	if cie.get('barcode'):
		path = cie.get('barcode')
	else:
		path = ""

	if cie.get('profile_image'):
		args['user_image'] = cie.get('profile_image')
	else:
		args['user_image']= ""

	ret_res = create_profile_in_db(res['entityid'],args,res,path)
	user = frappe.get_doc("User",frappe.session.user)
	send_phrs_mail(user.email,"PHR:Linked PHR Account Delinked","templates/emails/delink_phr.html",{"name":args['person_firstname']})
	msg = get_sms_template("delink",{"phr_name":args['person_firstname']})
	if user.contact:
		rec_list = []
		rec_list.append(user.contact)
		send_sms(rec_list,msg=msg)
	sub = dt['person_firstname']+" "+dt['person_lastname']+" "+"Profile Created Successfully"
	make_log(profile_id,"profile","create",sub)
	return ret_res

@frappe.whitelist(allow_guest=True)
def get_enabled_notification(profile_id):
	ret = frappe.db.sql("""select linked_phr,to_do 
		from `tabNotification Configuration` 
		where profile_id='%s'"""%(profile_id),as_dict=1)
	return ret

@frappe.whitelist(allow_guest=True)
def get_states():
	states = frappe.db.sql("""select name from `tabState`""",as_list=1)
	return states

@frappe.whitelist(allow_guest=True)
def notify_about_registration():
	mobile_nos = get_mobile_nos()
	if mobile_nos:
		send_sms(mobile_nos,msg='Please Complete Your Healthsnapp Registration')
		
def get_mobile_nos():
	nos = frappe.db.sql_list("""select contact from 
		`tabUser` where 
		profile_id in (SELECT profile_id 
			FROM `tabVerification Details` 
			WHERE creation > (NOW() - INTERVAL 2 DAY) 
			and mflag=0)""")

	return nos

@frappe.whitelist(allow_guest=True)
def notify_about_linked_phrs(profile_id,email_msg=None,text_msg=None,entity=None,user_name=None):
	linked_phr = frappe.db.sql("""select profile_id from 
		`tabNotification Configuration` 
		where linked_phr=1 and profile_id='%s'"""%(profile_id))
	if linked_phr:
		user = frappe.get_doc('User',frappe.db.get_value("User",{"profile_id":profile_id},"name"))
		if user:
			send_phrs_mail(user.name,"HealthSnapp Updates:"+entity+" Updated","templates/emails/linked_phrs_updates.html",{"user_name":user_name,"entity":entity})
			if frappe.db.get_value("Mobile Verification",{"mobile_no":user.contact,"mflag":1},"name"):
				rec_list = []
				rec_list.append(user.contact)
				send_sms(rec_list,msg=text_msg)
		else:
			from phr.templates.pages.dashboard import search_profile_data_from_solr
			search_profile_data_from_solr(profile_id)

@frappe.whitelist(allow_guest=True)
def get_patients_ids(doctype, txt, searchfield, start, page_len, filters):
	solr_op = 'admin/searchallprofile'
	url=get_base_url()+solr_op
	request_type = 'POST'
	data = {}
	from phr.phr.phr_api import get_response
	response = get_response(url,json.dumps(data),request_type)
	res = json.loads(response.text)
	profile_list = []
	profile_dic = {}
	if res['returncode']==120:
		for data in res['list']:
			profile_list.append([data['entityid'],data['email'],data['person_firstname']])

	return profile_list

@frappe.whitelist(allow_guest=True)
def check_existing(email,mobile):
	if frappe.db.sql("""select email from `tabUser`  where enabled=1 and email='%s'"""%(email)):
		return {"msg":"Email Already Used"}
	
	elif frappe.db.sql("""select contact from `tabUser`  where enabled=1 and contact='%s'"""%(mobile)):
		return {"msg":"Mobile No already Used"}

@frappe.whitelist(allow_guest=True)
def get_patients(doctype, txt, searchfield, start, page_len, filters):
	return frappe.db.sql("""select email,profile_id from `tabUser`  where enabled=1 and access_type='Patient'""")

@frappe.whitelist(allow_guest=True)
def verify_mobile():
	pass	

@frappe.whitelist(allow_guest=True)	
def get_phr_pdf(profile_id):
	import os, time
	path = os.path.join(os.getcwd(), get_site_path().replace('.',"").replace('/', ""), 'public', 'files', profile_id)
	solr_op = 'dms/getPhrPdfwithfilelocation'
	url = get_base_url()+solr_op
	request_type = 'POST'
	path += "/"
	data = {"profileId":profile_id,"file_location": [path]}
	from phr.phr.phr_api import get_response
	response = get_response(url,json.dumps(data),request_type)
	res = json.loads(response.text)
	if res:
		url = ""
		url = get_url()+"/files/%s/"%(profile_id)+cstr(res['file_location'].split('/')[-1]) + '?id=' + str(int(round(time.time() * 1000)))
		res["url"]=url
		response.headers['Content-Disposition'] = 'attachment; filename='+res["file_location"].split("/")[-1]
		return res
	else:
		frappe.msgprint(_("Issue Downloading PDF"))

@frappe.whitelist(allow_guest=True)	
def get_pdf(profile_id,options=None):
	import pdfkit, os, frappe
	from frappe.utils import scrub_urls
	from phr.templates.pages.dashboard import get_user_details
	if not options:
		options = {}

	options.update({
		"print-media-type": None,
		"background": None,
		"images": None,
		'margin-top': '15mm',
		'margin-right': '15mm',
		'margin-bottom': '15mm',
		'margin-left': '15mm',
		'encoding': "UTF-8",
		'no-outline': None
	})
	from phr.templates.pages.dashboard import get_user_details
	user = get_user_details(profile_id)
	html="""<html lang="en">
			  <head>
			    <title>Healthsnapp</title> 
			    <link rel="stylesheet" href="assets/phr/css/styles.css">
			  </head>
			  <body>
				<div class="row">
					<div class="card-container">
						<div class="card-main">
							<div class="card-top">
								<div class="card-top-left">
									<p class="patient-name">%(name)s</p>
									<p ><span>%(profile_id)s</span></p>
									<p class="patient-blood-grp">Blood Group:  %(blood_group)s</p>
									<p class="patient-contact">Contact: %(contact)s</p>
									<p class="patient-emergncy-contact">Emergency Contact: %(emergency_contact)s</p>
									<div class="clearfix"></div>
								</div>
								<div class="card-top-right">
									<div class="card-photo"><img src="%(user_image)s"></div>
									</div><div class="clearfix"></div>
								</div>
								<div class="card-bottom">
									<div class="card-logo">
										<img src="assets/phr/images/card-logo.png"></div>
										<div class="card-barcode"><img src="%(barcode)s">
									</div>
									<div class="clearfix"></div>
								</div>
								<div class="clearfix"></div>
							</div>
						</div>
					</div>
				  </body>
				</html>"""%user


	if not options.get("page-size"):
		options['page-size'] = "A4"
	
	import os, hashlib
	random_data = os.urandom(128)
	fname = hashlib.md5(random_data).hexdigest()[:30]


	html = scrub_urls(html)
	fname = os.path.join(get_files_path(), profile_id,  fname+"ed"+".pdf")
	pdfkit.from_string(html, fname, options=options or {})
	li = fname.split('/')
	
	import time
	url = get_url()+"/".join(["",li[-3],li[-2],li[-1]]) +'?id='+str(int(round(time.time() * 1000)))

	return url

@frappe.whitelist(allow_guest=True)	
def check_templates(profile_id):
	msg = get_sms_template("appointments",{"doctor_name":"ahahha","appointment_time":"4.25"})

@frappe.whitelist()
def reset_image(profile_id):
	update_user_image("/assets/phr/images/default-user.png", profile_id)
	return "done"

