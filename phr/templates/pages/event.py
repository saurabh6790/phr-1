import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path,cstr
from phr.templates.pages.patient import get_data_to_render


@frappe.whitelist(allow_guest=True)
def create_event(data=None):
	frappe.errprint(data)

	request_type="POST"
	url="http://192.168.5.11:9090/phr/createEvent"
	# url="http://88.198.52.49:7974/phr/createEvent"
	from phr.phr.phr_api import get_response

	data = json.loads(data)

	print "==============================create event================================="
	print data
	print "==========================================================================="
	event_data={
			"event_title": data.get('event_title'),
			"profile_id": data.get('profile_id'),
			"str_event_date": data.get('event_date'),
			"received_from": "Desktop",
			"event_descripton": data.get('event_descripton')
		}

	print "==============================create event 1================================="
	print event_data
	print "==========================================================================="

	response=get_response(url, json.dumps(event_data), request_type)
	
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
def send_shared_data(files, profile_id, folder, sub_folder, share_with, event_date, event, provider_name, event_body, event_id, content_type=None):
	from email.mime.audio import MIMEAudio
	from email.mime.base import MIMEBase
	from email.mime.image import MIMEImage
	from email.mime.text import MIMEText
	import mimetypes

	attachments = []
	frappe.errprint([files])
	files = eval(files)
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
					Please see attachment <br>
			"""%{'event': event, 'event_date': event_date, 'provider_name': provider_name, 'event_body':event_body}
		
		from frappe.utils.email_lib import sendmail
		sendmail([share_with], subject="PHR-Event Data", msg=cstr(msg),
				attachments=attachments)
	else:
		frappe.msgprint('Please select file(s) for sharing')



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
	url="http://192.168.5.11:9090/phr/phrdata/getprofileevent"
	# url="http://88.198.52.49:7974/phr/phrdata/getprofileevent"
	from phr.phr.phr_api import get_response
	pos = 0
	for filed_dict in fields:
		pos =+ 1
		if 'options' in filed_dict.keys(): 
			options = filed_dict.get('options')
			break
	
	print "======pos========"
	print pos 
	print "======pos========"

	data=json.loads(data)

	response=get_response(url, json.dumps({"profileId":data.get('profile_id')}), request_type)
	res_data = json.loads(response.text)

	print "=============event list======================="
	print response.text
	print "=============================================="

	if json.loads(res_data.get('phr')).get('eventList'):
		for visit in json.loads(res_data.get('phr')).get('eventList'):
			print visit
			options.extend([['<input type="checkbox" id = "%s">'%visit['entityid'], '<a nohref id="%s"> %s </a>'%(visit['entityid'],visit['event_title']), '15/01/2015', 
					visit['event_title']+'<br>'+visit['event_descripton'], 'DOC', 'Test Doc']])
		
	# # options.extend([['<input type="checkbox" id = "12345111222">', '<a nohref> 12345111222 </a>','15/01/2015', 
	# # 			'Dengue', 'DOC', 'Test Doc'], ['<input type="checkbox" id = "1234588888">', '<a nohref> 1234588888 </a>','15/01/2015', 
	# # 			'Dengue', 'DOC', 'Test Doc'], ['<input type="checkbox" id = "12345111333">', '<a nohref> 12345111333 </a>','15/01/2015', 
	# # 			'Dengue', 'DOC', 'Test Doc']])

	return {
		'options': options,
		'listview': fields
	}