from __future__ import unicode_literals
import frappe

def execute():
	for user in frappe.db.sql_list("""select name from `tabUser` where access_type='patient'"""):
		usr = frappe.get_doc("User",user)
		vd_name = frappe.db.get_value("Verification Details",{"profile_id":usr.profile_id},"name")
		if vd_name:
			vd = frappe.get_doc("Verification Details",vd_name)
			vd.mobile_no = usr.contact
			vd.created_via = 'Desktop'
			vd.save(ignore_permissions=True)	