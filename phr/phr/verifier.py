
from __future__ import unicode_literals
import frappe
from frappe.core.doctype.user.user import STANDARD_USERS
from frappe.utils import cint
import json
import requests
from frappe.auth import _update_password
from frappe import _

@frappe.whitelist(allow_guest=True)
def verify_email(id,key):
	hash=frappe.db.get_value('Verification Details',{"name":id},"hash")
	if hash!=key:
		frappe.msgprint("Email Verifcation not done")
	else:
		return "Email Verified"		

@frappe.whitelist(allow_guest=True)
def verify_mobile(id,code):
	print id, code
	mob_code=frappe.db.get_value('Verification Details',{"name":id},"mobile_verification_code")
	if mob_code!=code:
		# frappe.msgprint("Please Enter valid code")
		return {"returncode" : 404, "message_summary":"Please Enter valid code"}
	else:
		vd=frappe.get_doc('Verification Details',id)
		vd.mflag=1
		vd.save(ignore_permissions=True)
		return {"returncode" : 100, "message_summary":"Mobile Number Verified"}

@frappe.whitelist(allow_guest=True)
def update_password(new_password, id=None, old_password=None):
	# verify old password
	if id:
		user=frappe.db.get_value("User",{"profile_id":id})
		if old_password:
			if not frappe.db.sql("""select user from __Auth where password=password(%s)
				and user=%s""", (old_password, user)):
				return _("Cannot Update: Incorrect Password")

		_update_password(user, new_password)

		frappe.db.set_value("User", user, "reset_password_key", "")

		frappe.local.login_manager.logout()
		vd=frappe.get_doc('Verification Details',id)
		vd.pwdflag=1
		return _("Password Updated")
