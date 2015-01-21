import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path,cstr
from phr.templates.pages.patient import get_data_to_render

from phr.phr.phr_api import get_response


@frappe.whitelist(allow_guest=True)
def create_update_event(data=None):
	# url="http://88.198.52.49:7974/phr/createEvent"
	data = json.loads(data)

	if not data.get('entityid'):
		return create_event(data)

	else:
		res = update_event(data)
		print res 

def create_event(data):
	request_type="POST"
	url="http://192.168.5.12:9090/phr/createEvent"

	event_data={
			"event_title": data.get('event_title'),
			"profile_id": data.get('profile_id'),
			"str_event_date": data.get('event_date'),
			"received_from": "Desktop",
			"event_descripton": data.get('event_descripton')
		}

	response=get_response(url, json.dumps(event_data), request_type)
	
	return json.loads(response.text)

def update_event(data):
	request_type="POST"
	url="http://192.168.5.12:9090/phr-api/createupdateevent"

	print "=====================data ========================"
	print data
	print "=================================================="

	event_data =	{
			"entityid":data.get('entityid'),
			"status": "active",
			"event_diseasemontoring": False,
			"event_symptoms" : ["Cold" , "Weakness" , "headache"  ],
			"event_title": data.get('event_title'),
			"profile_id": data.get('profile_id'),
			"str_event_date": data.get('event_date'),
			"event_descripton": data.get('event_descripton'),
			"visit_files": data.get('dms_file_list'),
			"doctor_id": "1421767671044-180707",
			"doctor_name": data.get("provider_name"),
			"visit_descripton": data.get('event_descripton'),
			"received_from": "Desktop",
			"str_visit_date": data.get('event_date')
	}
	
	print "===========event data=============="
	print json.dumps(event_data)
	print "==================================="
	response=get_response(url, json.dumps(event_data), request_type)
	
	print response

	return json.loads(response.text)


@frappe.whitelist(allow_guest=True)
def get_attachments(profile_id, folder, sub_folder, event_id):
	files = []
	path = os.path.join(get_files_path(), profile_id, event_id, folder, sub_folder)
	if os.path.exists(path):
		for fl in os.listdir(path):
			frappe.errprint(fl.split('.')[-1:][0])
			if fl.split('.')[-1:][0] in ['jpg','jpeg','pdf','png', 'PDF']:
				files.append({'file_name': fl, 'type':fl.split('.')[-1:][0], 
					'path': os.path.join('files', profile_id, event_id, folder, sub_folder)})

	return files

@frappe.whitelist(allow_guest=True)
def send_shared_data(data):
	print "===========================share data====================="
	print data
	print "============================================================"
	# files, profile_id, folder, sub_folder, share_with, event_date, event, provider_name, event_body, event_id, content_type=None
	from email.mime.audio import MIMEAudio
	from email.mime.base import MIMEBase
	from email.mime.image import MIMEImage
	from email.mime.text import MIMEText
	import mimetypes

	data = json.loads(data)
	print "===============***************==========="
	print data.get('provider_name')
	print "===============***************==========="

	if data.get('email_id'):
		pass
		# attachments = []
		# frappe.errprint([files])
		# files = eval(files)
		# for fl in files:
		# 	fname = os.path.join(get_files_path(), fl)

		# 	attachments.append({
		# 			"fname": fname,
		# 			"fcontent": file(fname).read()
		# 		})

		# if attachments:
		# 	msg = """Event Name is %(event)s <br>
		# 			Event Date is %(event_date)s <br>
		# 			Provider Name is %(provider_name)s <br>
		# 			<hr>
		# 				%(event_body)s <br>
		# 				Please see attachment <br>
		# 		"""%{'event': event, 'event_date': event_date, 'provider_name': provider_name, 'event_body':event_body}
			
		# 	from frappe.utils.email_lib import sendmail
		# 	sendmail([share_with], subject="PHR-Event Data", msg=cstr(msg),
		# 			attachments=attachments)
		# else:
		# 	frappe.msgprint('Please select file(s) for sharing')

	if data.get('provider_name'):
		pass



@frappe.whitelist(allow_guest=True)
def get_visit_data(data):
	frappe.errprint(data)
	request_type="POST"
	url="http://192.168.5.11:9090/phr/phrdata/getprofilevisit"
	# url="http://88.198.52.49:7974/phr/phrdata/getprofilevisit"
	from phr.phr.phr_api import get_response

	options = json.loads(data).get('options')

	response=get_response(url, json.dumps({"profileId":"1420875579313-928788"}), request_type)
	res_data = json.loads(response.text)
	print "data"
	for visit in json.loads(res_data.get('phr')).get('visitList'):
		options.extend([['<input type="checkbox" id = "%s">'%visit['entityid'], '15/01/2015', 
				visit['visit_descripton'], 'DOC', visit['doctor_name']]])


	return options
		
@frappe.whitelist(allow_guest=True)
def get_event_data(data):
	frappe.errprint(data)

	fields, values, tab = get_data_to_render(data)

	print fields


	request_type="POST"
	url="http://192.168.5.12:9090/phr/phrdata/getprofileevent"
	# url="http://88.198.52.49:7974/phr/phrdata/getprofileevent"
	from phr.phr.phr_api import get_response

	pos = 0

	for filed_dict in fields:
		pos =+ 1
		if 'options' in filed_dict.keys(): 
			options = filed_dict.get('options')
			break

	data=json.loads(data)

	response=get_response(url, json.dumps({"profileId":data.get('profile_id')}), request_type)
	res_data = json.loads(response.text)

	url="http://192.168.5.12:9090/phr/phrdata/getprofilefilecount"
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

			data = ['<input type="checkbox" id = "%s">'%visit['entityid'], '<a nohref id="%s"> %s </a>'%(visit['entityid'],visit['event_title']), '15/01/2015', 
					visit['event_title']+'<br>'+visit['event_descripton'], 'DOC', 'Test Doc']
			
			event_list_updater(visit['entityid'], event_count_dict, count_list, data)
			
			options.extend([data])

	return {
		'options': options,
		'listview': fields
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
	
