
from __future__ import unicode_literals
import frappe
from frappe.core.doctype.user.user import STANDARD_USERS
from frappe.utils import cint
import json
import requests
import os


@frappe.whitelist(allow_guest=True)
def get_data_to_render(data=None):
	data = eval(data)

	if isinstance(data, dict):
		json_data = data
	if isinstance(data, basestring):
		json_data = get_json_data(data)	
	
	if json_data:
		data=json_data['data']
		values=get_values()
	return data,values
	
def get_json_data(file_name):
	with open(os.path.join(os.path.dirname(__file__), "profile.json"), "r") as json_data:
		json_data = json.loads(json_data.read())

	return json_data

def get_values():
	values={"person_firstname": "Amit" ,"person_lastname":"Shukla" ,"gender":"Male" }
	return 	values

	
