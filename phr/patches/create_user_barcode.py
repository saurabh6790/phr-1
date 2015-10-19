import os
import frappe
from phr.templates.pages.login import get_barcode, get_image_path

def execute():
	for user in frappe.db.sql("""select name, profile_id from tabUser 
			where barcode is null 
				and access_type in ('Patient', 'Provider')""",as_dict=1):

		barcode = get_barcode()
		path = get_image_path(barcode, user['profile_id'])
		file_path = os.path.join('files', user['profile_id'], user['profile_id']+".svg")
		
		curr_user = frappe.get_doc('User', user['name'])
		curr_user.barcode = file_path
		curr_user.save(ignore_permissions=True)