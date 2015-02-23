
from __future__ import unicode_literals
import frappe
from frappe.core.doctype.user.user import STANDARD_USERS
from frappe.utils import cint
import json
import requests
import os
from frappe.auth import _update_password
from frappe import _
from phr.phr.phr_api import get_response
from phr.templates.pages.patient import get_base_url
from phr.templates.pages.login import create_profile_in_db,get_barcode,get_image_path

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
	url = "%s/updateProfile"%get_base_url()
	from phr.phr.phr_api import get_response
	response=get_response(url,data,request_type)
	res=json.loads(response.text)
	print res
	if res['returncode']=="102":
		return "Profile Updated Successfully"


@frappe.whitelist(allow_guest=True)
def create_linkedphr(data):
	response=create_profile_solr(data)
	return response

@frappe.whitelist(allow_guest=True)
def create_profile_solr(data):
	print data
	request_type="POST"
	url="%s/createProfile"%get_base_url()
	barcode=get_barcode()
	path=get_image_path(barcode,res['entityid'])
	args=json.loads(data)
	args["barcode"]=str(barcode)
	data=json.dumps(args)
	from phr.phr.phr_api import get_response
	response=get_response(url,data,request_type)
	res=json.loads(response.text)
	print res
	if res and res.get('returncode')==101:
		data=json.loads(data)
		print "============================="
		print data
		args={"entityid":res.get('entityid'),"linking_id":data["linking_id"],"relationship":data["relationship"],"received_from":"Desktop"}
		request_type="POST"
		url="%s/linkprofile"%get_base_url()
		from phr.phr.phr_api import get_response
		response=get_response(url,json.dumps(args),request_type)
		res=json.loads(response.text)
		return res


