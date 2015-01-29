import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path,cstr
from phr.templates.pages.patient import get_data_to_render
import datetime
from phr.templates.pages.patient import get_base_url
import time
from phr.phr.phr_api import get_response


@frappe.whitelist(allow_guest=True)
def get_diseases():
	dt=frappe.db.sql("""select disease_name from `tabDisease Monitoring`""",as_list=1)
	return dt

@frappe.whitelist(allow_guest=True)
def get_disease_fields(name,profile_id=None):
	if name:
		dm=frappe.get_doc("Disease Monitoring",
			frappe.db.get_value("Disease Monitoring",{"disease_name":name},"name"))
		if dm:
			fields=[]
			rows=[]
			row_count=0
			for d in dm.get('parameters'):
				row_count+=1
				f_dic={"fieldname":d.fieldname,"fieldtype":d.fieldtype,"label":d.label}
				fields.append(f_dic)
				rows.append(d.label)
				if row_count==4:
					row_count=0
					f_dic={"fieldname":"","fieldtype":"column_break","label":""}
					fields.append(f_dic)
			s_break={"fieldname":"","fieldtype":"section_break","label":""}	
			fields.append(s_break)	
			row_dic={"fieldname":"tab","fieldtype": "table","label": "Disease Monitoring","rows":rows}
			fields.append(row_dic)
			values=get_values(profile_id,fields,dm.event_master_id)
			return fields, dm.event_master_id
	else:
		return 
		#values=get_existing_records_from_solr(profile_id,dm.event_master_id)

def get_values(profile_id,fields,event_master_id):
	res=get_existing_records_from_solr(profile_id,event_master_id)
	values=build_options(res,fields)

def get_existing_records_from_solr(profile_id,event_master_id):
	request_type="POST"
	url=get_base_url()+'getdiseasemtreventvisit'
	response=get_response(url,args,request_type)
	res=json.loads(response.text)
	print res

def build_options(profile_id,fields):
	pos
	for filed_dict in fields:
		pos =+ 1
		if 'rows' in filed_dict.keys(): 
			rows = filed_dict.get('rows')
			break

	for d in medication_list:
		rows.extend([["",d.medicine_name, d.dosage,d.from_date_time,d.to_date_time,d.additional_info]])



@frappe.whitelist(allow_guest=True)
def save_dm(data,arg,fields):
	str_data=[]
	for key,value in json.loads(data).items():
		datastr=key+'='+value
		str_data.append(datastr)
	args=json.loads(arg)
	args["data"]=str_data
	args["str_event_date"]=time.strftime("%x")
	#frappe.errprint(args)
	save_data_to_solr(json.dumps(args))


def save_data_to_solr(args):
	request_type="POST"
	url=get_base_url()+'updatedismonitoring'
	response=get_response(url,args,request_type)
	res=json.loads(response.text)
	print res
	# print res['returncode']
	# if res['returncode']==129:
	# 	link_provider(res)
	# 	return res



			
