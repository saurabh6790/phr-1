from __future__ import unicode_literals
import frappe
from frappe.utils import cint, now, get_gravatar
from frappe import throw, msgprint, _
from frappe.auth import _update_password
from frappe.core.doctype.notification_count.notification_count import clear_notifications
import frappe.permissions
import json
from frappe import _
import barcode
import time
import os
from phr.templates.pages.patient import get_base_url
#STANDARD_USERS = ("Guest", "Administrator")


@frappe.whitelist(allow_guest=True)
def create_profile(first_name,middle_name,last_name,email_id,contact,created_via):
	"""
		1.Create Profile in Core PHR(Solr)
		2.When Successful Create Profile  in ERPNext
		3.After Successful Profile Creation genarate link
		4.Complete Registration 
	"""
	user = frappe.db.get("User", {"email": email_id})
	if user:
		if user.disabled:
			return {"returncode" : 410, "message_summary":"Registered but disabled.","msg_display":"Registered but disabled."}
		else:
			return {"returncode" : 409, "message_summary" : "Already Registered","msg_display":"Already Registered"}
	else:
		barcode=get_barcode()
		args={'person_firstname':first_name,'person_middlename':middle_name,'person_lastname':last_name,'email':email_id,'mobile':contact,'received_from':created_via,'provider':'false',"barcode":str(barcode)}
		# return args
		profile_res=create_profile_in_solr(args)
		response=json.loads(profile_res)
		if response['returncode']==101:
			path=get_image_path(barcode,response['entityid'])
			file_path='/files/'+response['entityid']+'/'+response['entityid']+".svg"
			res=create_profile_in_db(response['entityid'],args,response,file_path)
			db=set_default_dashboard(response['entityid'])
			response['msg_display']='Profile created successfully, please check your email and complete signup process'
			return response
		else:
			return response

@frappe.whitelist(allow_guest=True)
def set_default_dashboard(profile_id):
	sr = frappe.get_doc({
		"doctype":"Shortcut",
		"profile_id":profile_id,	
		"created_via": "Web",
		"visits":1,
		"medications":1,
		"disease_monitoring":1,
		"events":1
	})
	sr.ignore_permissions = True
	sr.insert()	


@frappe.whitelist(allow_guest=True)
def get_barcode():
	barcode.PROVIDED_BARCODES
	EAN = barcode.get_barcode_class('ean13')        
	m = str(int(round(time.time() * 1000)))
	ean = EAN(m) 
	return ean       
   
@frappe.whitelist(allow_guest=True)    
def get_image_path(ean,entityid):
	path=get_path(entityid)
	fullname = ean.save(path)
	return fullname

@frappe.whitelist(allow_guest=True)  
def get_path(entityid):
	site_name = get_site_name()
	path = os.path.abspath(os.path.join('.',site_name, 'public', 'files'))
	directory = '/%s/%s/'%(path,entityid)
	if not os.path.exists(directory):                
		os.makedirs(directory)
	
	if directory:
		filepath = directory+entityid
	
	return filepath or None

@frappe.whitelist(allow_guest=True)  
def get_site_name():
       return frappe.local.site_path.split('/')[1]


@frappe.whitelist(allow_guest=True)
def create_profile_in_db(id,args,response,path=None):
	from frappe.utils import random_string
	password=random_string(10)
	user = frappe.get_doc({
		"doctype":"User",
		"email": args["email"],
		"profile_id":id,
		"first_name": args["person_firstname"],
		"middle_name": args["person_middlename"],
		"last_name": args["person_lastname"],
		"enabled": 1,
		"user_image": args.get('user_image'), 
		"contact":args["mobile"],
		"new_password": password,
		"user_type": "Website User",
		"access_type":"Patient",
		"barcode":path,
		"created_via":args["received_from"],
		"password_str":password
	})
	user.ignore_permissions = True
	user.insert()
	return _("Registration Details Emailed.")

def create_profile_in_solr(args):
	request_type="POST"
	url = "%s/createProfile"%get_base_url()
	data=json.dumps(args)
	from phr.phr.phr_api import get_response
	response=get_response(url,data,request_type)
	print response
	return response.text

@frappe.whitelist(allow_guest=True)
def reset_password(user):
	if user=="Administrator":
		return _("Not allowed to reset the password of {0}").format(user)
	try:
		user = frappe.get_doc("User", user)
		user.validate_reset_password()
		user.reset_password()
		return {"returncode":101,"msg_display":"Password reset instructions have been sent to your email"}
	except frappe.DoesNotExistError:
		msg="""User %s does not exist"""%user
		return {"returncode":401,"msg_display":msg}
		#return _("User {0} does not exist").format(user)

def user_query(doctype, txt, searchfield, start, page_len, filters):
	from frappe.widgets.reportview import get_match_cond
	txt = "%{}%".format(txt)
	return frappe.db.sql("""select name, concat_ws(' ', first_name, middle_name, last_name)
		from `tabUser`
		where ifnull(enabled, 0)=1
			and docstatus < 2
			and name not in ({standard_users})
			and user_type != 'Website User'
			and ({key} like %s
				or concat_ws(' ', first_name, middle_name, last_name) like %s)
			{mcond}
		order by
			case when name like %s then 0 else 1 end,
			case when concat_ws(' ', first_name, middle_name, last_name) like %s
				then 0 else 1 end,
			name asc
		limit %s, %s""".format(standard_users=", ".join(["%s"]*len(STANDARD_USERS)),
			key=searchfield, mcond=get_match_cond(doctype)),
			tuple(list(STANDARD_USERS) + [txt, txt, txt, txt, start, page_len]))

def get_total_users(exclude_users=None):
	"""Returns total no. of system users"""
	return len(get_system_users(exclude_users=exclude_users))

def get_system_users(exclude_users=None):
	if not exclude_users:
		exclude_users = []
	elif not isinstance(exclude_users, (list, tuple)):
		exclude_users = [exclude_users]

	exclude_users += list(STANDARD_USERS)

	system_users = frappe.db.sql_list("""select name from `tabUser`
		where enabled=1 and user_type != 'Website User'
		and name not in ({})""".format(", ".join(["%s"]*len(exclude_users))),
		exclude_users)

	return system_users

def get_active_users():
	"""Returns No. of system users who logged in, in the last 3 days"""
	return frappe.db.sql("""select count(*) from `tabUser`
		where enabled = 1 and user_type != 'Website User'
		and name not in ({})
		and hour(timediff(now(), last_login)) < 72""".format(", ".join(["%s"]*len(STANDARD_USERS))), STANDARD_USERS)[0][0]

def get_website_users():
	"""Returns total no. of website users"""
	return frappe.db.sql("""select count(*) from `tabUser`
		where enabled = 1 and user_type = 'Website User'""")[0][0]

def get_active_website_users():
	"""Returns No. of website users who logged in, in the last 3 days"""
	return frappe.db.sql("""select count(*) from `tabUser`
		where enabled = 1 and user_type = 'Website User'
		and hour(timediff(now(), last_login)) < 72""")[0][0]

def get_permission_query_conditions(user):
	if user=="Administrator":
		return ""

	else:
		return """(`tabUser`.name not in ({standard_users}))""".format(
			standard_users='"' + '", "'.join(STANDARD_USERS) + '"')

def has_permission(doc, user):
	if (user != "Administrator") and (doc.name in STANDARD_USERS):
		# dont allow non Administrator user to view / edit Administrator user
		return False

	else:
		return True