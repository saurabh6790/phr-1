
from __future__ import unicode_literals
import frappe
from frappe.core.doctype.user.user import STANDARD_USERS
from frappe.utils import cint
import json
import requests
import os
from frappe.auth import _update_password
from frappe import _

@frappe.whitelist(allow_guest=True)
def update_profile(data,id):
	call_mapper={
	"basic_info":update_profile_solr,
	"password":update_password,
	"update_phr":manage_phr}
	method=call_mapper.get(id)
	response=method(data)
	return response

@frappe.whitelist(allow_guest=True)
def update_profile_solr(data):
	request_type="POST"
	url="http://88.198.52.49:7974/phr/updateProfile"
	from phr.phr.phr_api import get_response
	response=get_response(url,data,request_type)
	res=json.loads(response.text)
	print res
	if res['returncode']=="102":
		return "Profile Updated Successfully"

@frappe.whitelist(allow_guest=True)
def update_password(data):
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
def manage_phr(data):
	frappe.errprint(data)