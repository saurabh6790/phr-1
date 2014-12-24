
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
def get_data_to_render():
	with open(os.path.join(os.path.dirname(__file__), "profile.json"), "r") as json_data:
		json_data = json.loads(json_data.read())
	if json_data:
		fields=json_data['fields']
		tab=json_data['tab']
		values=get_values()
		return fields,values,tab


"""
	get data generic method from all db's 
	return plain dictionary 
"""	
def get_values():
	values={"person_firstname": "Amit" ,"person_lastname":"Shukla" ,"gender":"Male" }
	return 	values

	
