
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
@frappe.whitelist(allow_guest=True)
def update_profile(data,id,dashboard=None):
	call_mapper={
	"basic_info":update_profile_solr,
	"password":update_password,
	"update_phr":manage_phr,
	"dashboard":manage_dashboard}
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
def manage_dashboard(data,dashboard=None):
	obj=json.loads(data)
	dashboard_fields=json.loads(dashboard)
	frappe.errprint(obj.get('entityid'))
	sr = frappe.get_doc({
		"doctype":"Shortcut",
		"profile_id":obj.get('entityid'),
		"created_via": "Web"
	})
	sr.ignore_permissions = True
	sr.insert()
	for d in dashboard_fields:
		frappe.db.sql("""update `tabShortcut` set %s=1 where name='%s'"""%(d,sr.name))
		frappe.db.commit()


@frappe.whitelist(allow_guest=True)
def upload_image(data,file_name=None):
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
	#url=get_base_url()+solr_op
	url="http://192.168.5.11:9090/phr/phrdata/searchchildphr"
	request_type='POST'
	data={"to_profile_id":"1421076971473-476287"}
	from phr.phr.phr_api import get_response
	response=get_response(url,json.dumps(data),request_type)
	res=json.loads(response.text)
	print res
	if res['returncode']==106:
		return res

