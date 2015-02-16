
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
from phr.phr.doctype.phr_activity_log.phr_activity_log import make_log

@frappe.whitelist(allow_guest=True)
def create_provider(data,id=None,profile_id=None):
	res=create_provider_in_solr(data,profile_id)
	return res

@frappe.whitelist(allow_guest=True)
def create_provider_in_solr(data,profile_id):
	request_type="POST"
	url=get_base_url()+'createProvider'
	from phr.phr.phr_api import get_response
	response=get_response(url,data,request_type)
	res=json.loads(response.text)
	print res
	print res['returncode']
	if res['returncode']==129:
		link_provider(res, data,profile_id)
		create_provider_master_entry(res, data)
		provider=json.loads(data)
		sub="created provider"+' '+Provider.get('name')
		make_log(profile_id,"provider","create",sub)
		return res


def link_provider(res, data,profile_id):
	data = json.loads(data)
	pl = frappe.get_doc({
		"doctype": "Providers Linked",
		"patient": profile_id,
		"provider_type": data.get('provider_type'), 
		"email": data.get('email'),
		"mobile": data.get('mobile'),
		"name1": data.get('name'),
		"provider": res["entityid"],
		"status": "Active",
		"created_via": "Web"
	})
	pl.ignore_permissions = True
	pl.insert()
	return pl.name

def create_provider_master_entry(res, data):
	data = json.loads(data)
	pl = frappe.get_doc({
		"doctype":"Provider",
		"provider_id": res["entityid"],
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


@frappe.whitelist(allow_guest=True)
def get_provider_List(profile_id):
	return frappe.db.sql("""select name1,provider from `tabProviders Linked` 
		where patient='%s' order by creation desc"""%(profile_id),as_dict=1)

@frappe.whitelist()
def get_self_details(profile_id):
	profile_info = frappe.db.sql(""" select p.provider_id, p.mobile_number,
			 p.email, p.provider_name, p.provider_type
			from tabProvider p, tabUser u 
			where p.provider_id=u.profile_id 
				and u.profile_id="%s" 
				and u.access_type="Provider" 
		"""%(profile_id),as_dict=1, debug=1)
	frappe.errprint(profile_info)
	return ((len(profile_info) > 1 ) and profile_info[0]) if profile_info else None
