# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from phr.templates.pages.utils import get_base_url
import json
from phr.phr.phr_api import get_response
from phr.templates.pages.event import get_event_wise_count_dict
import datetime


def execute(filters=None):
	columns= get_columns(filters)
	if filters:
		data=[]
		event_list=get_event_data(filters)
		if event_list:
			for d in event_list:
				data.append([d["event_name"],d["date"],d["complaint"],d["complaint_desc"],d["1"],d["2"],d["3"],d["4"],d["5"]])
		return columns, data
	else:
		data = []
		return columns, data

def get_columns(filters):
	"""return columns based on filters"""
	columns=["Event Name,::100","Date::150","Complaints::100",\
	"Complaints Desc::200","Consultation::70","Event Snaps::70",\
	"Lab Reports::70","Prescription::70","Cost of Care::70"]
	
	return columns

def get_event_data(filters):
	request_type="POST"
	url=get_base_url()+'admin/geteventfilecount'
	args={"profileId":filters.profile_id}
	response=get_response(url,json.dumps(args),request_type)
	res=response.text
	event_list=[]
	if res:
		jsonobj=json.loads(res)
		if jsonobj["returncode"]==139:
			for event in json.loads(jsonobj["list"]):
				event_count_dict={}
				event_dic={}
				get_event_wise_count_dict(event.get('eventFileMapCount'), event_count_dict)
				count_list=event_list_updater(event['event']['entityid'],event_count_dict)
				event_dic={"event_name":event['event']['event_title'],"date":datetime.datetime.fromtimestamp(event['event']['event_date']/1e3).strftime('%d-%m-%Y'),"complaint":event['event']['event_symptoms'],"complaint_desc":event['event']['event_descripton'],"1":count_list[0],"2":count_list[1],"3":count_list[2],"4":count_list[3],"5":count_list[4]}
				event_list.append(event_dic)
			return event_list		
			
@frappe.whitelist(allow_guest=True)
def event_list_updater(event, event_count_dict):
	count_list = [0, 0, 0, 0, 0]
	position_mapper = {'11': 0, '12': 1, "13": 2, "14": 3, "15": 4}
	if event_count_dict.get(event):
		for folder in sorted(event_count_dict.get(event)):
			count_list[position_mapper.get(folder)] =  event_count_dict.get(event).get(folder)
	return count_list



def get_conditions(filters):
	conditions = ""
	if filters.get("user_name"):
		conditions += " and name = '%s'" % filters["user_name"]
	return conditions
