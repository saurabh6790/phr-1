from __future__ import unicode_literals
import frappe

def execute():
	for user in frappe.db.sql_list("""select name from `tabUser` where access_type='patient'"""):
		usr_details = frappe.get_doc("User",user)
		if usr_details.contact:
			if not frappe.db.get_value("Mobile Verification",{"name":usr_details.contact},"name"):
				mv = frappe.get_doc({
					"doctype":"Mobile Verification",
					"profile_id":usr_details.profile_id,
					"mobile_no":usr_details.contact,
					"name":usr_details.contact
				})
				mv.ignore_permissions = True
				mv.insert()
				if frappe.db.get_value("Verification Details",{"mobile_no":usr_details.contact,"name":usr_details.profile_id,"mflag":1},"name"):
					mv.mflag = 1
					mv.save(ignore_permissions=True)