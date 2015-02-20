import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path,cstr
from phr.templates.pages.patient import get_data_to_render
import datetime

@frappe.whitelist(allow_guest=True)
def get_messages_list(data):
	
	fields, values, tab = get_data_to_render(data)
	pos = 0
	for filed_dict in fields:
		pos =+ 1
		if 'rows' in filed_dict.keys(): 
			rows = filed_dict.get('rows')
			break

	data=json.loads(data)
	log_list=fetch_values_from_db(data)
	for d in log_list:
		rows.extend([["",d.entity,d.operation,d.subject]])

	return {
		'rows': rows,
		'listview': fields
	}

def fetch_values_from_db(data):
	log_list=frappe.db.sql("""select * from 
		`tabPHR Activity Log` 
		where profile_id='%s' and entity in ('Event','Visit') order by creation desc"""%(data["profile_id"]),as_dict=1)
	return log_list