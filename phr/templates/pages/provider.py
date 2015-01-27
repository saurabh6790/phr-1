
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
		link_provider(res)
		return res


def link_provider(res):
	print res
	print frappe.user.name
	user=frappe.get_doc("User",frappe.user.name)
	print "======"
	print frappe.user
	pl = frappe.get_doc({
		"doctype":"Providers Linked",
		"patient":user.profile_id,
		"provider":res["entityid"],
		"status": "Active",
		"created_via": "Web"
	})
	pl.ignore_permissions = True
	pl.insert()
	return pl.name

