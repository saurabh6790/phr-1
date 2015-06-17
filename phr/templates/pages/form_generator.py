from __future__ import unicode_literals
import frappe
import json
import requests
import os

"""	read json for paticular to get the fields also get values if available """	
@frappe.whitelist(allow_guest=True)
def get_data_to_render(data=None,entityid=None):
	json_data, fields, values, tab = None, None, None, None
	if data:
		data = json.loads(data)

	if isinstance(data, dict):
		if not data.get('file_name'):
			json_data = data	
		else:
			json_data = get_json_data(data.get('file_name'))	

		if data.get('values'):
			json_data['values'] = data.get('values')

	if json_data:
		fields = json_data.get(data.get('param')) if json_data.get(data.get('param')) else json_data.get('fields')

		if data.get('method'):
			data = {"method" : data.get('method') }
		else:
			data = data
		
		tab = json_data.get('tab')
		values = get_values(data,entityid) if not json_data.get('values') else json_data.get('values')

	return fields, values, tab
	
@frappe.whitelist(allow_guest=True)	
def get_json_data(file_name):
	fn=file_name+'.json'
	with open(os.path.join(os.path.dirname(__file__), fn), "r") as json_data:
		json_data = json.loads(json_data.read())

	return json_data

def write_json_data(file_name,data):
	with open(os.path.join(os.path.dirname(__file__), file_name +".json"),'w+') as txtfile:
		txtfile.write(json.dumps(data, indent=1, sort_keys=True))

""" get data generic method from all db's return plain dictionary """	
def get_values(data,entityid=None):
	if entityid:
		url = get_url(data)
		args = get_args(entityid)
		values = get_data(url,args)
		return 	values
	return {}

def get_args(entityid):
	data={"entityid":entityid}
	args=json.dumps(data)
	return args

""" get values from solr """
def get_data(url, data, request_type="POST"):
	from phr.phr.phr_api import get_response
	response=get_response(url,data,request_type)
	
	if response:
		res=json.loads(response.text)
		data=res["list"][0]
		return data
	else:
		return "No data"

"""	get api url """
def get_url(data):
	from phr.templates.pages.utils import get_base_url

	method=get_method(data)
	base_url=get_base_url()
	url=base_url+method
	
	return url

""" Method to get name of service in solr database.contains dictionary or map."""
def get_method(data):
	method_dic={"profile":"searchProfile", "event":"searchEvent", "visit":"searchVisit", "provider":"searchProvider"}
	return method_dic.get(data.get('method'))