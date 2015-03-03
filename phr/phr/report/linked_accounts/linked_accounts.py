# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from phr.templates.pages.profile import get_linked_phrs


def execute(filters=None):
	columns= get_columns(filters)
	if filters:
		data=[]
		profile_list=get_profile_data(filters)
		if profile_list:
			for d in profile_list:
				data.append([d["first_name"],d["middle_name"],d["last_name"],d["email"],d["relationship"],d["mobile"]])
		return columns, data
	else:
		data = []
		return columns, data

def get_columns(filters):
	"""return columns based on filters"""
	columns=["First Name,::100","Middle Name::100","Last Name::100",\
	"Email::200","Relationship::100","Mobile::100"]
	
	return columns

def get_profile_data(filters):
	profile_id=frappe.db.get_value("User",{"email":filters.user_name},"profile_id")
	profile_data=get_linked_phrs(profile_id)
	profile_list=[]
	if profile_data:
		data=profile_data['list']
		for profile in data:
			profile_dic={}
			profile_dic={"first_name":profile["person_firstname"],"middle_name":profile["person_middlename"],"last_name":profile["person_lastname"],"email":profile["email"],"relationship":profile["relationship"],"mobile":profile["mobile"]}
			profile_list.append(profile_dic)
	return profile_list
	