
from __future__ import unicode_literals
import frappe
from frappe.core.doctype.user.user import STANDARD_USERS
from frappe.utils import cint
import json
import requests
import os


"""
	read json for paticular to get the fields also get values if available 
"""	
@frappe.whitelist(allow_guest=True)
def get_data_to_render(data=None,entityid=None):
	if data:
		data = eval(data)
	print data
	if isinstance(data, dict):
		json_data = data
	else:
		json_data = get_json_data(data)	
	
	if json_data:
		fields=json_data.get('fields')
		tab=json_data.get('tab')
		values=get_values(data,entityid) if not json_data.get('values') else json_data.get('values')

	return fields, values, tab
	
def get_json_data(file_name):
	fn=file_name+'.json'
	with open(os.path.join(os.path.dirname(__file__), fn), "r") as json_data:
		json_data = json.loads(json_data.read())

	return json_data


"""
	get data generic method from all db's 
	return plain dictionary 
"""	
def get_values(data,entityid=None):
	if entityid:
		url=get_url(data)
		args=get_args(entityid)
		values=get_data(url,args)
		return 	values
	return {}

def get_args(entityid):
	data={"entityid":entityid}
	args=json.dumps(data)
	return args


"""
	get values from solr
"""
def get_data(url,data):
	request_type="POST"
	url=url
	from phr.phr.phr_api import get_response
	response=get_response(url,data,request_type)
	if response:
		res=json.loads(response.text)
		print res
		data=res["list"][0]
		return data
	else:
		return "No data"
	

"""
	get api url
"""
def get_url(data):
	method=get_method(data)
	base_url=get_base_url()
	url=base_url+method
	return url


def get_base_url():
	return "http://192.168.5.11:9090/phr/"


"""
Method to get name of method in solr database.contains dictionary or map.
"""
def get_method(data):
	method_dic={"profile":"searchProfile"}
	return method_dic.get(data)


	
@frappe.whitelist(allow_guest=True)
def get_master_details(doctype):
	import itertools 

	ret = frappe.db.sql("select event_name from `tab%s` order by creation desc "%doctype,as_list=1)
	return list(itertools.chain(*ret))

