import frappe
import json
import os 
from phr.templates.pages.patient import get_data_to_render
import datetime
from phr.templates.pages.patient import get_base_url
import time
from phr.phr.phr_api import get_response
from frappe.utils import getdate, date_diff, nowdate, get_site_path, get_hook_method, get_files_path, \
		get_site_base_path, cstr, cint, today
from phr.phr.doctype.phr_activity_log.phr_activity_log import make_log



@frappe.whitelist(allow_guest=True)
def get_diseases():
	dt=frappe.db.sql("""select disease_name from `tabDisease Monitoring`""",as_list=1)
	return dt

@frappe.whitelist(allow_guest=True)
def get_disease_fields(name,profile_id=None):
	if name:
		dm = frappe.get_doc("Disease Monitoring",
			frappe.db.get_value("Disease Monitoring",{"disease_name":name},"name"))
		if dm:
			fields, rows, dm_cols, field_mapper = [], [], [""], ["sr"]
			row_count = 0

			for d in dm.get('parameters'):
				row_count += 1
				f_dic = {"fieldname":d.fieldname,"fieldtype":d.fieldtype,"label":d.label,"placeholder":"", "required": d.required or 0}
				fields.append(f_dic)
				dm_cols.append(d.label)
				field_mapper.append(d.fieldname)

				if row_count==4:
					row_count=0
					f_dic={"fieldname":"","fieldtype":"column_break","label":""}
					fields.append(f_dic)

			s_break = {"fieldname":"","fieldtype":"section_break","label":""}	
			fields.append(s_break)
			rows.append(dm_cols)
			row_dic={"fieldname":"tab","fieldtype": "table","label": "Disease Monitoring","rows":rows}
			fields.append(row_dic)
			values=get_values(profile_id, fields, dm.event_master_id, field_mapper)

			return {
				"fields":fields, 
				"event_master_id":dm.event_master_id,
				"values":values,
				"field_mapper":field_mapper
			}

def get_values(profile_id,fields,event_master_id,field_mapper,raw_fields=None, val_req=True):
	res=get_existing_records_from_solr(profile_id,event_master_id)
	if val_req:
		values=build_options(res,fields,field_mapper,raw_fields)
		return values
	return res

def get_existing_records_from_solr(profile_id,event_master_id):
	request_type="POST"
	url=get_base_url()+'getdiseasemtreventvisit'
	args={"profile_id":profile_id,"event_master_id":event_master_id}
	response=get_response(url,json.dumps(args),request_type)
	res=response.text
	if res:
		jsonobj=json.loads(res)
		if jsonobj["returncode"]==105:
			actdata=jsonobj["actualdata"]
			dmlist=json.loads(actdata)
			return dmlist[0]["disease_mtr_visit_List"]

def build_options(dm_list,fields,field_mapper,raw_fields=None):
	pos=0

	if isinstance(fields, list):
		fields_list=fields
	else:
		fields_list=json.loads(fields)
	
	for filed_dict in fields_list:
		pos =+ 1
		if 'rows' in filed_dict.keys(): 
			rows = filed_dict.get('rows')
			break

	if dm_list:
		for dm in dm_list:
			dm_data = []
			field_dict = {}

			for str_data in dm["data"]:
				val_list = str_data.split("=")
				field_dict[val_list[0]] = val_list[1]

			for field in field_mapper:
				if field == 'sr':
					dm_data.append('<input type="checkbox" name="">')
				else:
					dm_data.append("<div style='word-wrap: break-word;width:80%%;'>%s</div>"%field_dict[field])
			rows.extend([dm_data])

	return fields_list

@frappe.whitelist(allow_guest=True)
def save_dm(data, arg, fields, field_mapper, raw_fields=None, val_req=True):
	str_data=[]
	for key,value in json.loads(data).items():
		datastr=key+'='+value
		str_data.append(datastr)
	args=json.loads(arg)
	args["data"]=str_data
	args["str_event_date"]=time.strftime('%d/%m/%Y')

	if args.has_key("date"):
		args["str_diseaseMonitoring_date"]=args['date']
	else:
		args["str_diseaseMonitoring_date"]=	time.strftime('%d/%m/%Y')
	
	res=save_data_to_solr(json.dumps(args))
	values=get_values(args['profile_id'], fields, args['event_master_id'], json.loads(field_mapper), raw_fields, val_req) 
	
	return {
		"fields":values, 
		"event_master_id":args['event_master_id'],
		"values":values,
		"field_mapper":field_mapper
	}

def save_data_to_solr(args):
	request_type = "POST"
	url = get_base_url()+'updatedismonitoring'
	response = get_response(url,args,request_type)
	res = response.text
	if res:
		jsonobj=json.loads(res)
		if jsonobj['returncode']==132 or jsonobj['returncode']==133:
			dm=json.loads(args)
			sub="Disease Monitoring created"
			make_log(dm['profile_id'],"Disease Monitoring","create",sub)

@frappe.whitelist(allow_guest=True)
def render_table_on_db(profile_id,event_master_id,name):
	if name:
		data=get_disease_fields(name,profile_id)
		if data['values']:
			return {
				"res_list":data['values'][len(data['values'])-1],
				"rtcode":1
			}

@frappe.whitelist()
def share_dm(data, header, share_info, profile_id, disease=None):
	share_info = eval(share_info)
	frappe.create_folder(os.path.join(get_files_path() , profile_id))
	save_pdf(data, header, profile_id, disease)

	if share_info.get('share_via') == 'Email':
		return send_email(share_info, profile_id, disease)
	else:
		return share_via_phr(share_info, profile_id, disease)

@frappe.whitelist()
def save_pdf(data, header, profile_id, disease):
	import pdfkit

	data = eval(data)
	rows = ''
	for row in data:
		rows += "<tr>%s<tr>"%row

	html_str = """
		<html>
			<body>
				<table class="table table-striped">
					<thead>
						%(header)s
					</thead>
					%(data_rows)s
				</table>
			</body>
		</html>

	"""%{'data_rows': rows, 'header': header}
	file_name = disease + '.pdf'
	pdfkit.from_string(html_str, os.path.join(get_files_path(), profile_id, file_name))


def send_email(share_info, profile_id, disease):
	from email.mime.audio import MIMEAudio
	from email.mime.base import MIMEBase
	from email.mime.image import MIMEImage
	from email.mime.text import MIMEText
	import mimetypes
	import datetime

	attachments = []
	file_name = disease + '.pdf'
	files = os.path.join(get_files_path(), profile_id, file_name)

	attachments.append({
			"fname": files,
			"fcontent": file(files).read()
		})

	if attachments:
		msg = """Disease Name is %(event)s <br>
				Provider Name is %(provider_name)s <br>
				<hr>
					%(event_body)s <br>
					Please see attachment <br>
			"""%{'event': disease, 'provider_name': share_info.get('doctor_name'), 
			'event_body': share_info.get('email_body')}
		
		from frappe.utils.email_lib import sendmail

		sendmail([share_info.get('email_id')], subject="PHR-Disease Monitoring Data", msg=cstr(msg),
				attachments=attachments)
		return "Disease Monitoring records has been shared"

def share_via_phr(share_info, profile_id, disease):
	dm_sharing = frappe.new_doc('Disease Sharing Log')
	file_name = disease + '.pdf'
	dm_sharing.disease_name = disease
	dm_sharing.from_profile = profile_id
	dm_sharing.to_profile = share_info.get('doctor_id')
	dm_sharing.pdf_path = os.path.join(get_files_path(), profile_id, file_name)
	dm_sharing.save(ignore_permissions=True)
	make_sharing_request(share_info, disease, dm_sharing, profile_id)
	return "Disease Monitoring records has been shared"

def make_sharing_request(event_data, disease, dm_sharing, profile_id):
	req = frappe.new_doc('Shared Requests')
	req.event_id = dm_sharing.name
	req.provider_id = event_data.get('doctor_id')
	req.date = today()
	req.patient = profile_id
	req.patient_name = frappe.db.get_value("User", {"profile_id": profile_id}, 'concat(first_name, " ", last_name)')
	req.reason = event_data.get('reason')
	req.valid_upto = event_data.get('sharing_duration')
	req.event_title = disease
	req.doc_name = 'Disease Monitoring' 
	req.save(ignore_permissions=True)