import frappe
from phr.templates.pages.form_generator import get_data_to_render
from phr.phr.phr_api import get_response
from phr.templates.pages.utils import get_base_url
import json
import datetime
from frappe.utils import getdate, date_diff, nowdate, get_site_path, get_hook_method, get_files_path, \
		get_site_base_path, cstr, cint
import os

@frappe.whitelist(allow_guest=True)
def get_profile_list(data):
	
	request_type="POST"
	url="%s/sharephr/getprofilelistSharedFrom"%get_base_url()
	from phr.phr.phr_api import get_response

	pos = 0

	for filed_dict in fields:
		pos =+ 1
		if 'rows' in filed_dict.keys(): 
			rows = filed_dict.get('rows')
			break

	data=json.loads(data)

	response=get_response(url, json.dumps({"to_profile_id":data.get('profile_id')}), request_type)

	if response.text:
		res_data = json.loads(response.text)

		to_profile = data.get('profile_id')

		if res_data.get('visitshareProfileList'):
			for profile in res_data.get('visitshareProfileList'):
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
	dms_files = []
	filelist = frappe.db.sql("select files_list from `tabShared Requests` where name = '%s'"%data.get('other_param').get('req_id'), as_list=1)[0][0]
	filelist = json.loads(filelist)

	data_dict ={"to_profile_id":data.get('profile_id'), 
		"received_from": "desktop", "from_profile_id": data.get('other_param').get('patient_profile_id'), 
		"event_tag_id": data.get('other_param').get('event_id')}
	
	for fl in filelist:
		fl = fl.split('files/')[1].split('/')
		file_dict = {"entityid": fl[4],
			"profile_id": fl[0],
			"event_id": fl[1]}

		file_dict['tag_id'] = fl[4] + '-' +  fl[2].split('-')[1] + fl[3].split('_')[1]
		file_dict["file_id"] = [fl[5].replace('-watermark', '')]

		file_dict['file_location'] = [os.path.join(os.getcwd(), get_site_path().replace('.',"")
									.replace('/', ""), 'public', 'files',
									data_dict.get('to_profile_id'), 
									data.get('other_param').get('req_id'), fl[1], fl[2], fl[3], fl[4])]

		frappe.create_folder(file_dict['file_location'][0])

		file_dict['file_location'] = [file_dict['file_location'][0] + '/' + file_dict["file_id"][0]]

		if not  os.path.exists(file_dict['file_location'][0]):
			dms_files.append(file_dict)

		request_type="POST"
		url="%s/dms/getvisitmultiplefile"%get_base_url()
		from phr.phr.phr_api import get_response
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
def update_flag(req_id, provider_id, profile_id, event_id, doc_name):
	if doc_name == 'Event' or doc_name == 'Visit':
		d = get_patient_data({'profile_id': provider_id, 
			'other_param':{'patient_profile_id': profile_id, 'event_id': event_id, 'req_id': req_id}
			})
	frappe.db.sql("update `tabShared Requests` set approval_status = 'Accept' where name = '%s'"%(req_id))
	frappe.db.commit()

@frappe.whitelist()
def get_request(target, provider_id):
	method_mapper = {'my_req':get_myrequests, 'acc_req': get_acc_req, 'rej_req': get_rej_req}
	return method_mapper.get(target)(target, provider_id)

def get_myrequests(target, provider_id):
	data = frappe.db.sql("""select name, provider_id, patient, event_id, doc_name, DATE_FORMAT(date, '%s'), patient_name, event_title, reason, valid_upto, payment
				 from `tabShared Requests`
				 where ifnull(approval_status,'') not in ('Accept', 'Reject') 
					and provider_id="%s" and doc_name in ('Event', 'Disease Monitoring') and 
					DATE_FORMAT(STR_TO_DATE(valid_upto,'%s'), '%s') >= DATE_FORMAT(NOW(), '%s')
				 order by date desc, valid_upto asc """%('%d/%m/%Y',provider_id, '%d/%m/%Y', '%Y-%m-%d', '%Y-%m-%d'), as_list=1, debug=1)

	for d in data:
		d.append("""<button class="btn btn-success  btn-sm" 
						onclick="accept_request('%(req_id)s', '%(provider_id)s', '%(patient)s', '%(event_id)s', '%(doc_name)s')">
							<i class='icon-ok' data-toggle='tooltip' data-placement='top' 
							title='Accept'></i>
					</button>
					<button class="btn btn-warning  btn-sm" 
						onclick="reject_request('%(req_id)s','%(provider_id)s')">
							<i class='icon-remove' data-toggle='tooltip' data-placement='top' 
							title='Reject'></i>
					</button>"""%{'req_id':d[0], 'provider_id': d[1], 'patient': d[2], 'event_id': d[3], 'doc_name': d[4]})

	rows=[
		[{"title":"Date (Shared date)", "width":"120px !important;"}, {"title":"Patient Name","width":"100px;"}, 
				{"title":"Event Name","width":"100px;"}, {"title":"Reason for Sharing", "width":"150px;"}, 
				{"title":"Period of Sharing", "width":"120px !important;"}, {"title":"Payment Status", "width":"100px;"},
				{"title":"Accept-Reject", "width":"100px;"}]
	]

	if data:
		for d in data:
			rows.append(d[5:])
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
	import time
	data = frappe.db.sql("""select name, provider_id, patient, event_id, doc_name, DATE_FORMAT(date, '%s'), patient_name, event_title, reason, valid_upto, payment, ifnull(visit_id, '')
				 from `tabShared Requests`
				 where ifnull(approval_status,'') = 'Accept'
					and provider_id="%s" and 
					DATE_FORMAT(STR_TO_DATE(valid_upto,'%s'), '%s') >= DATE_FORMAT(NOW(), '%s') 
					order by date desc, valid_upto asc"""%('%d/%m/%Y', provider_id, '%d/%m/%Y', '%Y-%m-%d', "%Y-%m-%d"), as_list=1)

	for d in data:
		if d[4] == 'Event':
			d[7] = """<a nohref id="%(entityid)s" 
							onclick="Events.prototype.open_form('%(entityid)s', '%(event_title)s', '%(profile_id)s', '', '%(req_id)s', '%(visit_id)s')"> 
						%(event_title)s </a>"""%{'entityid':d[3], 'event_title': d[7], 'profile_id': d[2], 'req_id': d[0], 'visit_id': d[11]}
		else:
			dm_info = frappe.db.sql("""select dsl.disease_name, dsl.pdf_path 
				from `tabDisease Sharing Log` dsl
				where dsl.name = '%s' """%d[3], as_dict=1)[0]

			file_path = '/'.join(dm_info.get('pdf_path').split('/')[3:])  + '?id=' + str(int(round(time.time() * 1000)))
			d[7] = '<a target="_blank" href="/%s"> %s </a>' % ( file_path, dm_info['disease_name'])
					
	rows=[
		[{"title":"Date (Shared date)", "width":"120px !important;"}, {"title":"Patient Name", "width":"100px;"}, 
				{"title":"Event Name","width":"100px;"},{"title":"Reason for Sharing", "width":"100px;"},  {"title":"Period of Sharing", "width":"100px;"}, 
				{"title":"Payment Status", "width":"100px;"}, {"title":"Status", "width":"100px;"}]
	]

	if data:
		for d in data:
			rows.append(d[5:])
	else:
		rows.extend([["","NO DATA",""]])

	req_dict={"fieldname":"my_req1","fieldtype": "table","rows":rows}

	return [req_dict]


def get_rej_req(target, provider_id):
	data = frappe.db.sql("""select name, provider_id, patient, event_id, DATE_FORMAT(date, '%s'), patient_name, 
				event_title, reason, valid_upto, payment, rej_reason
				 from `tabShared Requests`
				 where ifnull(approval_status,'') = 'Reject'
					and provider_id="%s" """%('%d/%m/%Y',provider_id), as_list=1)

	rows=[
		[{"title":"Date (Shared date)","width":"120px !important;"}, {"title":"Patient Name", "width":"100px;"}, 
				{"title":"Event Name","width":"100px;"},{"title":"Reason for Sharing", "width":"100px;"}, {"title":"Period of Sharing", "width":"100px;"}, 
				{"title":"Payment Status", "width":"100px;"}, {"title":"Reason For Rejection", "width":"100px;"}]
	]

	if data:
		for d in data:
			rows.append(d[4:])
	else:
		rows.extend([["","NO DATA",""]])

	req_dict={"fieldname":"my_req1","fieldtype": "table","rows":rows}

	return [req_dict]