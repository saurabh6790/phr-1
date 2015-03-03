# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from phr.templates.pages.patient import get_base_url
import json
from phr.phr.phr_api import get_response
from phr.templates.pages.event import get_event_wise_count_dict
import datetime
from phr.phr.report.events.events import event_list_updater

def execute(filters=None):
	columns= get_columns(filters)
	if filters:
		data=[]
		visit_list=get_visit_data(filters)
		if visit_list:
			for d in visit_list:
				data.append([d["event_name"],d["date"],d["desc"],d["doc"],d["1"],d["2"],d["3"],d["4"],d["5"]])
		return columns, data
	else:
		data = []
		return columns, data

def get_columns(filters):
	"""return columns based on filters"""
	columns=[]
	columns=["Event,::100","Date::150","Description::100",\
	"Provider Name::100","Consultation::70","Event Snaps::70",\
	"Lab Reports::70","Prescription::70","Cost of Care::70"]

	return columns

def get_visit_data(filters):
	request_type="POST"
	url=get_base_url()+'admin/getvisitfilecount'
	args={"profileId":filters.profile_id}
	response=get_response(url,json.dumps(args),request_type)
	res=response.text
	visit_list=[]
	if res:
		jsonobj=json.loads(res)
		if jsonobj["returncode"]==139:
			for event in json.loads(jsonobj["list"]):
				event_count_dict={}
				visit_dic={}
				frappe.errprint(event)
				get_event_wise_count_dict(event.get('visitFileMapCount'), event_count_dict)
				count_list=event_list_updater(event['visit']['entityid'],event_count_dict)
				visit_dic={"event_name":event['visit']['event']['event_title'],"date":datetime.datetime.fromtimestamp(event['visit']['visit_date']/1e3).strftime('%d-%m-%Y'),"desc":event['visit']['visit_descripton'],"doc":event['visit']['doctor_name'],"1":count_list[0],"2":count_list[1],"3":count_list[2],"4":count_list[3],"5":count_list[4]}
				visit_list.append(visit_dic)
			return visit_list
