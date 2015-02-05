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

	fields, values, tab = get_data_to_render(data)

	print fields


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
	fields, values, tab = get_data_to_render(data)
	dms_files = []
	file_dict = {}
	request_type="POST"
	url="%s/sharephr/searchsharedeventdata"%get_base_url()
	from phr.phr.phr_api import get_response

	pos = 0

	for filed_dict in fields:
		print filed_dict 
		pos =+ 1
		if 'rows' in filed_dict.keys(): 
			rows = filed_dict.get('rows')
			break

	data=json.loads(data)

	data_dict ={"to_profile_id":data.get('profile_id'), 
			"received_from": "desktop", "from_profile_id": data.get('other_param').get('patient_profile_id')}

	response=get_response(url, json.dumps(data_dict), request_type)

	res_data = json.loads(response.text)

	if res_data.get('Jsoneventlist'):
		for event_details in res_data.get('Jsoneventlist'):
			event =  event_details.get('event')

			data = ["""<a nohref id="%(entityid)s" 
						onclick="Events.prototype.open_form('%(entityid)s', '%(event_title)s', '%(profile_id)s')"> 
					%(event_title)s </a>"""%{"entityid": event['entityid'],"event_title": event['event_title'], 
					"profile_id":data_dict.get('profile_id')}, 
					datetime.datetime.fromtimestamp(cint(event['event_date'])/1000.0).strftime('%d/%m/%Y'), 
					event['event_symptoms']]

			rows.extend([data])
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
		url="%s/phr-api/dms/getvisitmultiplefile"%get_base_url()
		from phr.phr.phr_api import get_response

		param = {"filelist": dms_files}
		response=get_response(url, json.dumps(param), request_type)

		get_dm_data(rows, data_dict)

	return {
		'rows': rows,
		'listview': fields,
		'page_size': 5
	}

def get_dm_data(rows, data_dict):
	for dm_data in frappe.db.sql("""select distinct dm.from_profile as entityid , u.first_name as person_firstname, 
							ifnull(u.last_name,'') as person_lastname, dm.disease_name as disease_name, dm.pdf_path as pdf_path
						from `tabDisease Sharing Log` dm, `tabUser` u 
						where dm.to_profile = '%s' 
							and dm.from_profile = u.profile_id """%to_profile, as_dict=1):
		file_path = '/'.join(dm_data.get('pdf_path').split('/')[3:])
		data = ['<a target="_blank" href="/%(file_path)s"> %s </a>'%( file_path, dm_data['disease_name']), 
					'', 
					'']
		rows.extend([data])

	return rows

