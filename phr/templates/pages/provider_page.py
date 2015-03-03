import frappe
from phr.templates.pages.patient import get_data_to_render
from phr.phr.phr_api import get_response
from phr.templates.pages.patient import get_base_url
import json
import datetime
from frappe.utils import getdate, date_diff, nowdate, get_site_path, get_hook_method, get_files_path, \
		get_site_base_path, cstr, cint
import os

@frappe.whitelist(allow_guest=True)
def get_profile_list(data):
	print "in provider page p1"
	print data

	# fields, values, tab = get_data_to_render(data)

	# print fields


	request_type="POST"
	url="%s/sharephr/getprofilelistSharedFrom"%get_base_url()
	from phr.phr.phr_api import get_response

	pos = 0

	for filed_dict in fields:
		print filed_dict 
		pos =+ 1
		if 'rows' in filed_dict.keys(): 
			rows = filed_dict.get('rows')
			break

	data=json.loads(data)

	response=get_response(url, json.dumps({"to_profile_id":data.get('profile_id')}), request_type)

	print response.text
	if response.text:
		res_data = json.loads(response.text)

		to_profile = data.get('profile_id')

		if res_data.get('visitshareProfileList'):
			for profile in res_data.get('visitshareProfileList'):
				print profile.get("entityid"), profile.get("person_firstname"), profile.get("person_lastname")
				data = ['<a nohref id="%s"> %s %s </a>'%(profile.get("entityid"), profile.get("person_firstname"), profile.get("person_lastname"))]
				rows.extend([data])

	rows = get_dm_profiles(rows, to_profile)

	return {
		'rows': rows,
		'listview': fields,
		'page_size': 5
	}

def get_dm_profiles(rows, to_profile):
	for dm_data in frappe.db.sql("""select distinct dm.from_profile as entityid , u.first_name as person_firstname, 
							ifnull(u.last_name,'') as person_lastname 
						from `tabDisease Sharing Log` dm, `tabUser` u 
						where dm.to_profile = '%s' 
							and dm.from_profile = u.profile_id """%to_profile, as_dict=1):
		data = ['<a nohref id="%s"> %s %s </a>'%(dm_data.get("entityid"), dm_data.get("person_firstname"), dm_data.get("person_lastname"))]
		rows.extend([data])

	return rows

@frappe.whitelist(allow_guest=True)
def get_patient_data(data):
	# fields, values, tab = get_data_to_render(data)
	dms_files = []
	file_dict = {}
	print "\n\n--------------------------patient data------------------"
	request_type="POST"
	url="%s/sharephr/searchsharedeventdata"%get_base_url()
	from phr.phr.phr_api import get_response
	pos = 0
	# for filed_dict in fields:
	# 	print filed_dict 
	# 	pos =+ 1
	# 	if 'rows' in filed_dict.keys(): 
	# 		rows = filed_dict.get('rows')
	# 		break
	# data=json.loads(data)
	data_dict ={"to_profile_id":data.get('profile_id'), 
			"received_from": "desktop", "from_profile_id": data.get('other_param').get('patient_profile_id'), 
			"event_tag_id": data.get('other_param').get('event_id')}
	response=get_response(url, json.dumps(data_dict), request_type)
	res_data = json.loads(response.text)
	
	accepted_event_list =  get_accepted_event_list(data_dict.get('to_profile_id'))
	if res_data.get('Jsoneventlist'):
		for event_details in res_data.get('Jsoneventlist'):
			event =  event_details.get('event')
			# if [event['entityid']] in accepted_event_list:
			# data = ["""<a nohref id="%(entityid)s" 
			# 			onclick="Events.prototype.open_form('%(entityid)s', '%(event_title)s', '%(profile_id)s')"> 
			# 		%(event_title)s </a>"""%{"entityid": event['entityid'],"event_title": event['event_title'], 
			# 		"profile_id":data_dict.get('from_profile_id')}, 
			# 		datetime.datetime.fromtimestamp(cint(event['event_date'])/1000.0).strftime('%d/%m/%Y'), 
			# 		event['event_symptoms']]

			# rows.extend([data])
			for visit_details in event_details.get('visitList'):
				for file_deatils in visit_details.get('visit_files'):
					for file_info in file_deatils.get('file_location'):

						tags = file_deatils.get('entityid').split('-')[-1:][0]

						file_dict = {"entityid": visit_details.get('entityid'),
							"profile_id": visit_details.get('profile_id'),
							"event_id": event.get('entityid')}

						file_dict['tag_id'] = file_deatils.get('entityid')
						file_dict["file_id"] = file_info.split('/')[-1:]
						file_dict['file_location'] = [os.path.join(os.getcwd(), get_site_path().replace('.',"")
													.replace('/', ""), 'public', 'files',
													data_dict.get('to_profile_id'), 
													event.get('entityid'), 
													file_deatils.get('tag_name') + '-' + tags[:2],
													file_deatils.get('sub_tag_name') + '_' + tags[-2:],
													visit_details.get('entityid'))]

						frappe.create_folder(file_dict['file_location'][0])

						file_dict['file_location'] = [file_dict['file_location'][0] + '/' + file_dict["file_id"][0]]

						if not  os.path.exists(file_dict['file_location'][0]):
							dms_files.append(file_dict)

		request_type="POST"
		url="%s/dms/getvisitmultiplefile"%get_base_url()
		from phr.phr.phr_api import get_response
		print dms_files
		param = {"filelist": dms_files}
		response=get_response(url, json.dumps(param), request_type)

	# get_dm_data(rows, data_dict)


def get_dm_data(rows, data_dict):
	for dm_data in frappe.db.sql("""select distinct dm.from_profile as entityid , u.first_name as person_firstname, 
							ifnull(u.last_name,'') as person_lastname, dm.disease_name as disease_name, dm.pdf_path as pdf_path
						from `tabDisease Sharing Log` dm, `tabUser` u 
						where dm.to_profile = '%s' 
							and dm.from_profile = u.profile_id """%data_dict.get('to_profile_id'), as_dict=1):
		file_path = '/'.join(dm_data.get('pdf_path').split('/')[3:])
		data = ['<a target="_blank" href="/%s"> %s </a>'%( file_path, dm_data['disease_name']), 
					'', 
					'']
		rows.extend([data])
	return rows


def get_accepted_event_list(provider_id):
	return frappe.db.sql("""select event_id	from `tabShared Requests` 
		where provider_id = '%s' """%(provider_id),as_list=1)[0][0]

@frappe.whitelist()
def get_shared_request(profile_id):
	return frappe.db.sql("""select name,event_title from `tabShared Requests` 
				where ifnull(approval_status,'') not in ('Accepted', 'Rejected') 
					and provider_id="%s" """%(profile_id), as_list=1)

@frappe.whitelist()
def update_flag(req_id, provider_id, profile_id, event_id):
	frappe.errprint(['test update update_flag',req_id, provider_id, profile_id, event_id])
	d = get_patient_data({'profile_id': provider_id, 
		'other_param':{'patient_profile_id': profile_id, 'event_id': event_id}
		})
	frappe.db.sql("update `tabShared Requests` set approval_status = 'Accept' where name = '%s'"%(req_id))
	frappe.db.commit()

@frappe.whitelist()
def get_request(target, provider_id):
	method_mapper = {'my_req':get_myrequests, 'acc_req': get_acc_req, 'rej_req': get_rej_req}
	return method_mapper.get(target)(target, provider_id)

def get_myrequests(target, provider_id):
	data = frappe.db.sql("""select name, provider_id, patient, event_id, date, patient_name, event_title, reason, valid_upto, payment
				 from `tabShared Requests`
				 where ifnull(approval_status,'') not in ('Accept', 'Reject') 
					and provider_id="%s" and doc_name = 'Event'  """%(provider_id), as_list=1)

	for d in data:
		d.append("""<button class="btn btn-success  btn-sm" 
						onclick="accept_request('%(req_id)s', '%(provider_id)s', '%(patient)s', '%(event_id)s')">
							<i class='icon-ok' data-toggle='tooltip' data-placement='top' 
							title='Accept'></i>
					</button>
					<button class="btn btn-warning  btn-sm" 
						onclick="reject_request('%(req_id)s')">
							<i class='icon-remove' data-toggle='tooltip' data-placement='top' 
							title='Reject'></i>
					</button>"""%{'req_id':d[0], 'provider_id': d[1], 'patient': d[2], 'event_id': d[3]})

	rows=[
		["Date (Shared date)", "Patient Name", "Event Name",
				"Reason for Sharing",  "Period of Sharing", 
				"Payment Status", "Accept-Reject"]
	]

	if data:
		for d in data:
			rows.append(d[4:])
	else:
		rows.extend([["","NO DATA",""]])

	req_dict={"fieldname":"my_req1","fieldtype": "table","rows":rows}

	return [req_dict]

@frappe.whitelist()
def update_request_record(req_id, rej_reason):
	sr = frappe.get_doc('Shared Requests', req_id)
	sr.approval_status = 'Reject'
	sr.rej_reason = rej_reason
	sr.save()

def get_acc_req(target, provider_id):
	data = frappe.db.sql("""select name, provider_id, patient, event_id, date, patient_name, event_title, reason, valid_upto, payment
				 from `tabShared Requests`
				 where ifnull(approval_status,'') = 'Accept'
					and provider_id="%s" """%(provider_id), as_list=1)

	for d in data:
		d[6] = """<a nohref id="%(entityid)s" 
						onclick="Events.prototype.open_form('%(entityid)s', '%(event_title)s', '%(profile_id)s')"> 
					%(event_title)s </a>"""%{'entityid':d[3], 'event_title': d[6], 'profile_id': d[2]}

	rows=[
		["Date (Shared date)", "Patient Name", "Event Name",
				"Reason for Sharing",  "Period of Sharing", 
				"Payment Status", "Status"]
	]

	if data:
		for d in data:
			rows.append(d[4:])
	else:
		rows.extend([["","NO DATA",""]])

	req_dict={"fieldname":"my_req1","fieldtype": "table","rows":rows}

	return [req_dict]


def get_rej_req(target, provider_id):
	data = frappe.db.sql("""select name, provider_id, patient, event_id, date, patient_name, 
				event_title, reason, valid_upto, payment, rej_reason
				 from `tabShared Requests`
				 where ifnull(approval_status,'') = 'Reject'
					and provider_id="%s" """%(provider_id), as_list=1)

	rows=[
		["Date (Shared date)", "Patient Name", "Event Name",
				"Reason for Sharing",  "Period of Sharing", 
				"Payment Status", "Reason For Rejection"]
	]

	if data:
		for d in data:
			rows.append(d[4:])
	else:
		rows.extend([["","NO DATA",""]])

	req_dict={"fieldname":"my_req1","fieldtype": "table","rows":rows}

	return [req_dict]