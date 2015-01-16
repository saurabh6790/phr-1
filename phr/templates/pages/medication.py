import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path,cstr
from phr.templates.pages.patient import get_data_to_render


@frappe.whitelist(allow_guest=True)
def get_medication_data(data):
	
	fields, values, tab = get_data_to_render(data)

	pos = 0
	for filed_dict in fields:
		pos =+ 1
		if 'options' in filed_dict.keys(): 
			options = filed_dict.get('options')
			break

	data=json.loads(data)
	#response=get_response(url, json.dumps({"profileId":data.get('profile_id')}), request_type)
	#res_data = json.loads(response.text)
	# if json.loads(res_data.get('phr')).get('eventList'):
	# 	for visit in json.loads(res_data.get('phr')).get('eventList'):
	# 		print visit
	# 		options.extend([['<input type="checkbox" id = "%s">'%visit['entityid'], '<a nohref id="%s"> %s </a>'%(visit['entityid'],visit['event_title']), '15/01/2015', 
	# 				visit['event_title']+'<br>'+visit['event_descripton'], 'DOC', 'Test Doc']])
	# return {
	# 	'options': options,
	# 	'listview': fields
	# }
	return {
		'options': options,
		'listview': fields
	}
