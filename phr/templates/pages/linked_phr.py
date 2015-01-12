
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
def update_linked_profile(data,id):
	call_mapper={
	"basic_info":update_profile_solr,
	"notification":update_notifications,
	"dashboard":manage_dashboard}
	method=call_mapper.get(id)
	response=method(data)
	return response

@frappe.whitelist(allow_guest=True)
def update_profile_solr(data):
	request_type="POST"
	url="http://192.168.5.11:9090/phr/updateProfile"
	from phr.phr.phr_api import get_response
	response=get_response(url,data,request_type)
	res=json.loads(response.text)
	print res
	if res['returncode']=="102":
		return "Profile Updated Successfully"


@frappe.whitelist(allow_guest=True)
def manage_dashboard(data):
	frappe.errprint(data)

@frappe.whitelist(allow_guest=True)
def update_notifications(data):
	frappe.errprint(data)


@frappe.whitelist(allow_guest=True)
def create_linkedphr(data,id):
	frappe.errprint(["py",data,id])
	call_mapper={
	"basic_info":create_profile_solr,
	"notification":create_notifications,
	"dashboard":manage_dashboard}
	method=call_mapper.get(id)
	response=method(data)
	return response

@frappe.whitelist(allow_guest=True)
def create_profile_solr(data):
	request_type="POST"
	url="http://192.168.5.11:9090/phr/createProfile"
	from phr.phr.phr_api import get_response
	response=get_response(url,data,request_type)
	res=json.loads(response.text)
	print res
	if res and res.get('returncode')==101:
		data=json.loads(data)
		args={"entityid":res.get('entityid'),"linking_id":data.linking_id,"relationship":data.relationship,"received_from":"Desktop"}
		request_type="POST"
		url="http://192.168.5.11:9090/phr/linkprofile"
		from phr.phr.phr_api import get_response
		response=get_response(url,json.dumps(args),request_type)
		res=json.loads(response.text)
		print res


	# return "Linked PHR Created Successfully"

@frappe.whitelist(allow_guest=True)
def create_notifications(data):
	frappe.errprint(data)