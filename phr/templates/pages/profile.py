
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
	url="http://88.198.52.49:7974/phr/updateProfile"
	from phr.phr.phr_api import get_response
	response=get_response(url,data,request_type)
	res=json.loads(response.text)
	print res
	if res['returncode']=="102":
		return "Profile Updated Successfully"


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
		update_values_notify(dashboard_fields,mn)
	else:
		mn = frappe.get_doc({
			"doctype":"Notification Configuration",
			"profile_id":obj.get('entityid'),
			"created_via": "Web"
		})
		mn.ignore_permissions = True
		mn.insert()
		update_values_notify(dashboard_fields,mn.name)
	
def update_values_notify(dashboard_fields,name):
	for d in dashboard_fields:
		frappe.db.sql("""update `tabNotification Configuration` set %s=1 where name='%s'"""%(d,name))
		frappe.db.commit()

@frappe.whitelist(allow_guest=True)
def manage_dashboard(data,dashboard=None):
	obj=json.loads(data)
	dashboard_fields=json.loads(dashboard)
	sr=frappe.db.get_value("Shortcut",{"profile_id":obj.get('entityid')},"name")
	if sr:
		update_values(dashboard_fields,sr)
	else:
		sr = frappe.get_doc({
			"doctype":"Shortcut",
			"profile_id":obj.get('entityid'),	
			"created_via": "Web"
		})
		sr.ignore_permissions = True
		sr.insert()
		upload_values(dashboard_fields,sr.name)

def update_values(fields,name):
	for d in fields:
		frappe.db.sql("""update `tabShortcut` set %s=1 where name='%s'"""%(d,name))
		frappe.db.commit()

@frappe.whitelist(allow_guest=True)
def upload_image(data=None,files=None):
	frappe.errprint([data,files])
	from binascii import a2b_base64
	import base64
	data_index = data.index('base64') + 7
	filedata = data[data_index:len(data)]
	decoded_image = base64.b64decode(filedata)
	site_name = get_site_name()
	path = os.path.abspath(os.path.join('.',site_name, 'public', 'files'))
	image=path+'/'+frappe.session.user+".png"
	file_path='/files/'+frappe.session.user+".png"
	if os.path.exists(image):
		try:
			os.remove(image)
			fd = open(image, 'wb')
			fd.write(decoded_image)
			fd.close()
			update_user_image(file_path)
		except OSError, e:
			print ("Error: %s - %s." % (e.filename,e.strerror))
	else:
		fd = open(image, 'wb')
		fd.write(decoded_image)
		fd.close()
		update_user_image(file_path)

def update_user_image(path):
	frappe.errprint(path)
	user=frappe.get_doc("User",frappe.session.user)
	user.user_image=path
	user.save(ignore_permissions=True)



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
	for id in ids:
		print obj[id]
		ret_res=delink_phr_solr(obj[id],id,profile_id)
		print ret_res
	return profile_id

def delink_phr_solr(data,id,profile_id):
	from phr.templates.pages.patient import get_base_url
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
		args={'person_firstname':dt['person_firstname'],'person_middlename':dt['person_middlename'],'person_lastname':dt['person_lastname'],'email':dt['email'],'mobile':dt['mobile'],'received_from':'Desktop','provider':'false','barcode':str(barcode)}
		ret_res=create_profile_in_db(res['entityid'],args,res,path)
		return ret_res


@frappe.whitelist(allow_guest=True)
def get_enabled_notification(profile_id):
	ret=frappe.db.sql("""select linked_phr,to_do 
		from `tabNotification Configuration` 
		where profile_id='%s'"""%(profile_id),as_dict=1)
	return ret

@frappe.whitelist(allow_guest=True)
def get_enabled_dashboard(profile_id):
	pass