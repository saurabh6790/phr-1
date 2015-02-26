# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

def execute(filters=None):
	if filters:
		columns= get_columns(filters)
		data=[]
		event_list=get_event_data(filters)

		# if event_list:
		# 	data=json.loads(obj)
		# 	if data and data["eventList"]:
		# 		for d in data["eventList"]:
		# 			data.append([[d["event_title"],datetime.datetime.fromtimestamp(cint(d["event_date"])/1000.0),d["event_symptoms"],d["diagnosis_desc"]]])				data.append(v)

		return columns, data
	else:
		columns, data = [], []
		return columns, data

def get_columns(filters):
	"""return columns based on filters"""
	columns=[]
	columns.append("Event Name,::100","Date::150","Complaints::100",\
	"Complaints Desc::200","Consultation::40","Event Snaps::40",\
	"Lab Reports::40","Prescription::40","Cost of Care::40") 
	return columns,dm

def get_event_data(filters):
	#conditions = get_conditions(filters)
	request_type="POST"
	url=get_base_url()+'admin/geteventfilecount'
	args={"profileId":filters.profile_id}
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
