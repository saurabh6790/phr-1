
from __future__ import unicode_literals
import frappe
from frappe.core.doctype.user.user import STANDARD_USERS
from frappe.utils import cint
import json
import requests
import os
from frappe.auth import _update_password
from frappe import _
from phr.templates.pages.patient import get_base_url
import json

@frappe.whitelist(allow_guest=True)
def create_provider(data,id=None):
	res=create_provider_in_solr(data)
	return res

@frappe.whitelist(allow_guest=True)
def create_provider_in_solr(data):
	request_type="POST"
	url=get_base_url()+'createProvider'
	from phr.phr.phr_api import get_response
	response=get_response(url,data,request_type)
	res=json.loads(response.text)
	print res
	print res['returncode']
	if res['returncode']==129:
		link_provider(res, data)
		create_provider_master_entry(res, data)
		return res


def link_provider(res, data):
	data = json.loads(data)
	user=frappe.get_doc("User",frappe.user.name)

	pl = frappe.get_doc({
		"doctype":"Providers Linked",
		"patient":user.profile_id,
		"email": data.get('email'),
		"mobile": data.get('mobile'),
		"name1": data.get('name'),
		"provider":res["entityid"],
		"status": "Active",
		"created_via": "Web"
	})
	pl.ignore_permissions = True
	pl.insert()
	return pl.name

def create_provider_master_entry(res, data):
	data = json.loads(data)
	user=frappe.get_doc("User",frappe.user.name)

	pl = frappe.get_doc({
		"doctype":"Provider",
		"provider_category": "Contact List",
		"provider_type": data.get('provider_type'),
		"provider_name": data.get('name'),
		"provider_number": data.get('mobile'),
		"email": data.get('email'),
		"address": str(data.get('address1')) + '\n' + str(data.get('address2')),
		"created_via": "Web"
	})
	pl.ignore_permissions = True
	pl.insert()