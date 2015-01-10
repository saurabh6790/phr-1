import frappe
import json
import os 
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path

@frappe.whitelist(allow_guest=True)
def create_event(data=None):
	frappe.errprint(data)

	# request_type="POST"
	# url="http://192.168.5.11:9090/phr/createProfile"
	# from phr.phr.phr_api import get_response
	# response=get_response(url,json.loads(data),request_type)
	# return response.text


@frappe.whitelist(allow_guest=True)
def get_attachments(profile_id, folder, sub_folder):
	files = []
	path = os.path.join(get_files_path(), profile_id, folder, sub_folder)
	if os.path.exists(path):
		for fl in os.listdir(path):
			frappe.errprint(fl.split('.')[-1:][0])
			if fl.split('.')[-1:][0] in ['jpg','jpeg','pdf','png', 'PDF']:
				files.append({'file_name': fl, 'type':fl.split('.')[-1:][0], 
					'path': os.path.join('files', profile_id, folder, sub_folder)})

	return files

@frappe.whitelist(allow_guest=True)
def send_shared_data(files, profile_id, folder, sub_folder, content_type=None):
	from email.mime.audio import MIMEAudio
	from email.mime.base import MIMEBase
	from email.mime.image import MIMEImage
	from email.mime.text import MIMEText
	import mimetypes

	attachments = []

	files = eval(files)
	for fl in files:
		fname = os.path.join(get_files_path(), profile_id, folder, sub_folder, fl)

		attachments.append({
				"fname": fname,
				"fcontent": file(fname).read()
			})

	frappe.errprint(attachments)

	from frappe.utils.email_lib import sendmail
	sendmail(['saurabh6790@gmail.com'], subject='Shared File', msg =("Please see attachment"),
			attachments=attachments)