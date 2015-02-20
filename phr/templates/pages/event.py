import frappe
import json
import os 
from frappe.utils import getdate, date_diff, nowdate, get_site_path, get_hook_method, get_files_path, \
		get_site_base_path, cstr, cint, today
from phr.templates.pages.patient import get_data_to_render
from phr.phr.phr_api import get_response
import datetime
from phr.templates.pages.patient import get_base_url
from phr.phr.doctype.phr_activity_log.phr_activity_log import make_log

@frappe.whitelist(allow_guest=True)
def create_update_event(data=None):
	# url="http://88.198.52.49:7974/phr/createEvent"
	data = json.loads(data)

	if not data.get('entityid'):
		return create_event(data)

	else:
		res = update_event(data)

		if res.get('returncode') == 116:
			clear_dms_list(data.get('dms_file_list'))
			copy_files_to_visit(data.get('dms_file_list'), res.get('visit').get('entityid'))

		res['entityid'] = res['event']['entityid']	

		return res

def create_event(data):
	response = ''
	request_type="POST"
	url = "%s/createEvent"%get_base_url()

	event_data={
			"event_title": data.get('event_title'),
			"profile_id": data.get('profile_id'),
			"str_event_date": data.get('event_date'),
			"received_from": "Desktop",
			"event_symptoms" : data.get('complaints'),
			"event_descripton": data.get('event_descripton')
		}

	event_date = datetime.datetime.strptime(event_data.get('str_event_date'), "%d/%m/%Y").strftime('%Y-%m-%d')
	
	if date_diff(event_date, nowdate()) > 0:
		frappe.msgprint("Event Date should be past or current",raise_exception=1)

	else:
		response=get_response(url, json.dumps(event_data), request_type)
		make_log(json.loads(response.text).get('entityid'),"Event","Create","Event Created")

	return json.loads(response.text)

def update_event(data):
	response = ''
	request_type="POST"
	url="%s/createupdateevent"%get_base_url()

	event_data =	{
			"entityid":data.get('entityid'),
			"event_complaint_list":[],
			"profile_owner_name": frappe.db.get_value('User', {'profile_id':data.get('profile_id')}, 'first_name'),
			"status": "active",
			"event_diseasemontoring": False,
			"event_symptoms" :data.get('complaints'),
			"event_title": data.get('event_title'),
			"profile_id": data.get('profile_id'),
			"str_event_date": data.get('event_date'),
			"event_descripton": data.get('event_descripton'),
			"visit_files": data.get('dms_file_list'),
			"doctor_id": data.get('doctor_id'),
			"doctor_name": data.get("doctor_name"),
			"visit_descripton": data.get('event_descripton'),
			"received_from": "Desktop",
			"str_visit_date": data.get('visit_date'),
			"diagnosis_desc": data.get('diagnosis_desc')
	}

	import datetime
	event_date = datetime.datetime.strptime(event_data.get('str_event_date'), "%d/%m/%Y").strftime('%Y-%m-%d')
	
	if date_diff(event_date, nowdate()) > 0:
		frappe.msgprint("Please sect valid date")

	else:
		response=get_response(url, json.dumps(event_data), request_type)
		make_log(data.get('entityid'),"Event","Update","Event Updated")

	return json.loads(response.text)

def clear_dms_list(dms_file_list):
	import os
	for loc in dms_file_list:
		os.remove(loc.get('file_location')[0])

def copy_files_to_visit(dms_file_list, visit_id):
	import os, shutil, glob
	for loc in dms_file_list:
	
		path_lst = loc.get('file_location')[0].split('/')
		
		file_path = os.path.join('/'.join(path_lst[0:len(path_lst)-1]), visit_id)
		
		frappe.create_folder(file_path)

		for filename in glob.glob(os.path.join('/'.join(path_lst[0:len(path_lst)-1]), '*.*')):
			print filename
			shutil.move(filename, file_path)

@frappe.whitelist(allow_guest=True)
def get_attachments(profile_id, folder, sub_folder, event_id, visit_id=None):
	files = []

	if visit_id:
		path = os.path.join(get_files_path(), profile_id, event_id, folder, sub_folder, visit_id)
	else:
		path = os.path.join(get_files_path(), profile_id, event_id, folder, sub_folder, visit_id)

	if os.path.exists(path):
		for root, dirc, filenames in os.walk(path):
			for di in dirc:
				for fl in os.listdir(os.path.join(path,di)):
					if fl.split('.')[-1:][0] in ['jpg','jpeg','pdf','png', 'PDF']:
						files.append({'file_name': fl, 'type':fl.split('.')[-1:][0], 
							'path': os.path.join('files', profile_id, event_id, folder, sub_folder, di)})

		for fl in os.listdir(path):
			if fl.split('.')[-1:][0] in ['jpg','jpeg','pdf','png', 'PDF']:
				files.append({'file_name': fl, 'type':fl.split('.')[-1:][0], 
					'path': os.path.join('files', profile_id, event_id, folder, sub_folder, visit_id)})
					

	return files

@frappe.whitelist(allow_guest=True)
def send_shared_data(data):
	from email.mime.audio import MIMEAudio
	from email.mime.base import MIMEBase
	from email.mime.image import MIMEImage
	from email.mime.text import MIMEText
	import mimetypes
	import datetime

	data = json.loads(data)

	if data.get('share_via') == 'Email':
		share_via_email(data)

	if data.get('share_via') == 'Provider Account':
		return share_via_providers_account(data)
		
def share_via_email(data):
	attachments = []
	files = data.get('files')
	for fl in files:
		fname = os.path.join(get_files_path(), fl)

		attachments.append({
				"fname": fname,
				"fcontent": file(fname).read()
			})

	if attachments:
		msg = """Event Name is %(event)s <br>
				Event Date is %(event_date)s <br>
				Provider Name is %(provider_name)s <br>
				<hr>
					%(event_body)s <br>
					Please find below attachment(s) <br>
			"""%{'event': data.get('event_title'), 'event_date': data.get('event_date'), 
				'provider_name': data.get('doctor_name'), 'event_body': data.get('email_body')}
		
		from frappe.utils.email_lib import sendmail

		sendmail([data.get('email_id')], subject="PHR-Event Data", msg=cstr(msg),
				attachments=attachments)

		make_log(data.get('profile_id'),"Event","Shared Via Email","Event Shared Via Email to %s"%(data.get('email_id')))

		return """Selected image(s) has been shared with 
			%(provider_name)s for event %(event)s """%{
				'event': data.get('event_title'),
				'provider_name': data.get('doctor_name')}
	else:
		frappe.msgprint('Please select file(s) for sharing')

def share_via_providers_account(data):
	if not data.get('files'):
		event_data =	{
				"sharelist": [
						{
							"to_profile_id": data.get('doctor_id'),
							"received_from":"desktop",
							"from_profile_id": data.get('profile_id'),
							"event_tag_id": data.get('entityid') if not data.get('event_id') else data.get('event_id'),
							"access_type": "RDW",
							"str_start_date": datetime.datetime.strptime(nowdate(), '%Y-%m-%d').strftime('%d/%m/%Y'),
							"str_end_date": data.get('sharing_duration')
						}
					]
				}

		request_type="POST"
		url="%s/sharephr/sharemultipleevent"%get_base_url()

		response=get_response(url, json.dumps(event_data), request_type)
		
		make_sharing_request(event_data, data)
		make_log(data.get('profile_id'),"Event","Shared Via Provider","Event Shared Via Provider")
		return eval(json.loads(response.text).get('sharelist'))[0].get('message_summary')

	else:
		sharelist = []
		for fl in data.get('files'):
			
			file_details = fl.split('/')
			sharelist.append({
				"to_profile_id": data.get('doctor_id'),
				"received_from":"desktop",
				"from_profile_id": data.get('profile_id'),
				"visit_tag_id": file_details[4],
				"event_tag_id": data.get('entityid') if not data.get('event_id') else data.get('event_id'),
				"tag_id": file_details[4] + '-' + cstr(file_details[2].split('-')[1]) + cstr(file_details[3].split('_')[1]) ,
				"file_id": [file_details[5].replace('-watermark', '')],
				"file_access": ['RW'],
				"str_start_date": datetime.datetime.strptime(nowdate(), '%Y-%m-%d').strftime('%d/%m/%Y'),
				"str_end_date": data.get('sharing_duration')
			})
		
		request_type="POST"
		url = "%s/sharephr/sharemultiplevisitfiles"%get_base_url()
		event_data = {'sharelist': sharelist}
		
		response=get_response(url, json.dumps(event_data), request_type)
		make_sharing_request(event_data, data)
		make_log(data.get('profile_id'),"Event","Shared Via Provider","Event Shared Via Provider")
		return json.loads(json.loads(response.text).get('sharelist'))[0].get('message_summary')

def make_sharing_request(event_data, data):
	req = frappe.new_doc('Shared Requests')
	d = event_data.get('sharelist')[0]

	frappe.errprint([d, type(d), data])

	req.event_id = d.get("event_tag_id")
	req.provider_id = d.get("to_profile_id")
	req.date = today()
	req.patient = d.get("from_profile_id")
	req.patient_name = frappe.db.get_value("User", {"profile_id":d.get("from_profile_id")}, 'concat(first_name, " ", last_name)')
	req.reason = data.get('reason')
	req.valid_upto = data.get('sharing_duration')
	req.event_title = data.get("event_title")
	req.doc_name = 'Event' 
	req.save()

@frappe.whitelist(allow_guest=True)
def get_visit_data(data):
	request_type="POST"
	url="%s/phrdata/getprofilevisit"%get_base_url()
	from phr.phr.phr_api import get_response

	fields, values, tab = get_data_to_render(data)

	pos = 0

	for filed_dict in fields:
		pos =+ 1
		if 'rows' in filed_dict.keys(): 
			rows = filed_dict.get('rows')
			break

	data=json.loads(data)

	response=get_response(url, json.dumps({"profileId":data.get('profile_id')}), request_type)
	res_data = json.loads(response.text)

	url = "%s/phrdata/getprofilevisitfilecount"%get_base_url()

	response=get_response(url, json.dumps({"profile_id":data.get('profile_id')}), request_type)
	res_data1 = json.loads(response.text)

	event_count_dict = {}
	get_event_wise_count_dict(res_data1.get('FileCountData'), event_count_dict)
	
	if isinstance(type(res_data), dict):
		res_data = res_data.get('phr')

	else:
		res_data = json.loads(res_data.get('phr'))	

	if res_data.get('visitList'):
		for visit in res_data.get('visitList'):

			count_list = [0, 0, 0, 0, 0]

			data = ['<input  type="radio" name="visit" id = "%s">'%visit['entityid'],
					visit['event']['event_title'], visit['str_visit_date'], 
					visit['visit_descripton'], visit['doctor_name']]

			event_list_updater(visit['entityid'], event_count_dict, count_list, data)
			
			rows.extend([data])
	
	return {
		'rows': rows,
		'listview': fields,
		'page_size': 5
	}

@frappe.whitelist(allow_guest=True)
def get_event_data(data):
	fields, values, tab = get_data_to_render(data)

	request_type="POST"
	url="%s/phrdata/getprofileevent"%get_base_url()
	from phr.phr.phr_api import get_response

	pos = 0

	for filed_dict in fields:
		pos =+ 1
		if 'rows' in filed_dict.keys(): 
			rows = filed_dict.get('rows')
			break

	data=json.loads(data)
	profile_id = data.get('profile_id')
	response=get_response(url, json.dumps({"profileId":data.get('profile_id')}), request_type)
	res_data = json.loads(response.text)

	url = "%s/phrdata/getprofilefilecount"%get_base_url()
	response=get_response(url, json.dumps({"profile_id":data.get('profile_id')}), request_type)
	res_data1 = json.loads(response.text)

	event_count_dict = {}
	get_event_wise_count_dict(res_data1.get('FileCountData'), event_count_dict)

	if isinstance(type(res_data), dict):
		res_data = res_data.get('phr')

	else:
		res_data = json.loads(res_data.get('phr'))	

	if res_data.get('eventList'):
		for visit in res_data.get('eventList'):
			count_list = [0, 0, 0, 0, 0]
			if not visit.get("event_diseasemontoring"):
				data = ['<input type="radio" name="event" id = "%s" ">'%visit['entityid'], 
						"""<a nohref id="%(entityid)s" onclick="Events.prototype.open_form('%(entityid)s', '%(event_title)s', '%(profile_id)s')"> %(event_title)s </a>"""%{"entityid": visit['entityid'],"event_title": visit['event_title'], "profile_id":profile_id}, 
						datetime.datetime.fromtimestamp(cint(visit['event_date'])/1000.0).strftime('%d/%m/%Y'), 
						"<div style='word-wrap: break-word;width:60%%;'>%s</div>"%' ,'.join(visit['event_symptoms'])]
				
				event_list_updater(visit['entityid'], event_count_dict, count_list, data)
				
				rows.extend([data])

	return {
		'rows': rows,
		'listview': fields,
		'page_size': 5
	}

def get_event_wise_count_dict(count_dict, event_count_dict):
	count_dict =  json.loads(count_dict)
	for key in count_dict:
		folder = key.split('-')[-1][:2]
		event = '-'.join(key.split('-')[:-1])

		if not event_count_dict.get(event):
			event_count_dict[event] = {}

		if not event_count_dict.get(event).get(folder):
			event_count_dict[event][folder] = count_dict[key]	
		else:
			event_count_dict[event][folder] += count_dict[key]

def event_list_updater(event, event_count_dict, count_list, data):
	position_mapper = {'11': 0, '12': 1, "13": 2, "14": 3, "15": 4}
	if event_count_dict.get(event):
		for folder in sorted(event_count_dict.get(event)):
			count_list[position_mapper.get(folder)] =  event_count_dict.get(event).get(folder)
	data.extend(count_list)


@frappe.whitelist()
def get_providers(filters):
	filters = eval(filters)
	cond = get_conditions(filters)
	result_set = get_provider_info(cond)
	
	return result_set

def get_conditions(filters):
	cond = []

	if filters.get('provider_type'):
		cond.append('provider_type = "%(provider_type)s"'%filters)

	if filters.get('name'):
		cond.append('provider_name like "%%%(name)s%%"'%filters)

	if filters.get("specialization"):
		cond.append('specialization like "%%%(specialization)s%%"'%filters)

	if filters.get('provider_loc'):
		cond.append('address like "%%%(provider_loc)s%%" or address_2 like "%%%(provider_loc)s%%" or city like "%%%(provider_loc)s%%" or state like "%%%(provider_loc)s%%"'%filters)

	return ' and '.join(cond)

def get_provider_info(cond):
	if cond:
		ret = frappe.db.sql("""select provider_id, provider_name, mobile_number, email from tabProvider where %s """%cond, as_list=1, debug=1)
		frappe.errprint(ret)
		return ((len(ret[0]) > 1) and ret) if ret else None
	
	else:
		return none
@frappe.whitelist()
def get_linked_providers(profile_id=None):
	import itertools
	frappe.errprint(['get_linked_providers', profile_id])
	if profile_id:
		ret = frappe.db.sql("select name1, provider, mobile, email, provider_type from  `tabProviders Linked` where patient = '%s' and status = 'Active' "%profile_id, as_dict=1)
		
		for r in ret:
			r.update({'label': r['name1'], 'value': r['name1']})
		frappe.errprint(ret)
		return ret