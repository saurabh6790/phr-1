# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class PHRActivityLog(Document):
	pass


@frappe.whitelist(allow_guest=True)
def make_log(profile_id,entity,operation,subject,full_name=None):
	al = frappe.get_doc({
		"doctype":"PHR Activity Log",
		"profile_id":profile_id,
		"entity": entity,
		"operation": operation,
		"subject":subject,
		"full_name": full_name,
	})
	al.ignore_permissions = True
	al.insert()