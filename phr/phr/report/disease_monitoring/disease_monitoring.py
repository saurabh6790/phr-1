# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from phr.templates.pages.utils import get_base_url
import time
from phr.phr.phr_api import get_response
import json

def execute(filters=None):
	if filters:
		columns,dmobj = get_columns(filters)
		data=[]
		dm_list=get_dm_data(dmobj)

		if dm_list:
			for dm in dm_list:
				v=[]
				f_dic={}
				for d in dm["data"]:
					val_list=d.split("=")
					f_dic[val_list[0]]=val_list[1]
				for f in dmobj.get('parameters'):
					v.append(f_dic[f.fieldname])
				data.append(v)

		return columns, data
	else:
		columns, data = [], []
		return columns, data

def get_columns(filters):
	"""return columns based on filters"""
	dm=frappe.get_doc("Disease Monitoring",
			frappe.db.get_value("Disease Monitoring",{"disease_name":filters["disease"]},"name"))
	columns=[]
	for d in dm.get('parameters'):
		field=d.label+"::150"		
		columns.append(field) 
	return columns,dm

def get_dm_data(dm):
	#conditions = get_conditions(filters)
	request_type="POST"
	url=get_base_url()+'admin/getalldiseasemtreventvisit'
	args={"event_master_id":dm.name}
	response=get_response(url,json.dumps(args),request_type)
	res=response.text
	if res:
		jsonobj=json.loads(res)
		if jsonobj["returncode"]==105:
			actdata=jsonobj["list"]
			#dmlist=json.loads(actdata)
			return actdata[0]["disease_mtr_visit_List"]



def get_conditions(filters):
	conditions = ""
	if filters.get("user_name"):
		conditions += " and name = '%s'" % filters["user_name"]
	return conditions
