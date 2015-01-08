import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path

@frappe.whitelist(allow_guest=True)
def create_event(data):
	frappe.errprint(data)

	# request_type="POST"
	# url="http://192.168.5.11:9090/phr/createProfile"
	# from phr.phr.phr_api import get_response
	# response=get_response(url,json.loads(data),request_type)
	# return response.text


@frappe.whitelist(allow_guest=True)
def get_attachments(profile_id):
	files = []
	for fl in os.listdir(get_files_path()):
		if fl.split('.')[1] in ['jpg','jpeg','pdf','png', 'PDF']:
			files.append({'file_name': fl, 'type':fl.split('.')[1]})

	return files
	