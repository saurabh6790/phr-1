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
	url="http://192.168.5.11:9090/phr-api/sharephr/getprofilelistSharedFrom"
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
	res_data = json.loads(response.text)

	if res_data.get('visitshareProfileList'):
		for profile in res_data.get('visitshareProfileList'):
			print profile.get("entityid"), profile.get("person_firstname"), profile.get("person_lastname")
			data = ['<a nohref id="%s"> %s %s </a>'%(profile.get("entityid"), profile.get("person_firstname"), profile.get("person_lastname"))]
			rows.extend([data])

	return {
		'rows': rows,
		'listview': fields,
		'page_size': 5
	}


@frappe.whitelist(allow_guest=True)
def get_patient_data(data):
	fields, values, tab = get_data_to_render(data)
	dms_files = []
	file_dict = {}
	request_type="POST"
	url="http://192.168.5.11:9090/phr-api/sharephr/searchsharedeventdata"
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

	print data_dict

	response=get_response(url, json.dumps(data_dict), request_type)
	res_data = json.loads(response.text)

	if res_data.get('Jsoneventlist'):
		for event_details in res_data.get('Jsoneventlist'):
			event =  event_details.get('event')

			data = ['<a nohref id="%s"> %s </a>'%(event['entityid'], 
					event['event_title']), 
					datetime.datetime.fromtimestamp(cint(event['event_date'])/1000.0).strftime('%d/%m/%Y'), 
					event['event_symptoms']]

			rows.extend([data])

			# print event_details.get('visitList')

			# for visit_details in event_details.get('visitList'):
				# print "\n\n visit_details \n"
				# print visit_details
				# print "\n"
				# break

				# for file_deatils in visit_details.get('visit_files'):
				# 	print "\n\n\n\n\n\n\n iechya gavat "
				# 	print file_deatils
				# 	print "\n\n\n\n\n\n\n\n"

					# for file_info in file_deatils.get('file_location'):
					# 	tags = file_deatils.get('entityid').split('-')[-1:]

					# 	file_dict = {"entityid": visit_details.get('entityid'),
					# 		"profile_id": visit_details.get('profile_id'),
					# 		"event_id": event.get('entityid')}

					# 	file_dict['tag_id'] = file_deatils.get('entityid')
					# 	file_dict["file_id"] = file_info.split('/')[-1:]
					# 	file_dict['path'] = os.path.join(os.getcwd(), get_site_path().replace('.',"")
					# 								.replace('/', ""), 'public', 'files',
					# 								data.get('other_param').get('patient_profile_id'), 
					# 								event.get('entityid'), 
					# 								visit_details.get('tag_name') + '-' + tags[:2],
					# 								visit_details.get('sub_tag_name') + '_' + tags[-2:],
					# 								visit_details.get('entityid'))



					# 	dms_files.append(file_dict)
		print "\n\n\n --------------data--------------\n"		
		print file_dict
		print "\n\n\n\n"

	return {
		'rows': rows,
		'listview': fields,
		'page_size': 5
	}