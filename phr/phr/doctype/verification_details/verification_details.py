# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class VerificationDetails(Document):
	def on_update(self):
		if self.mflag == 1:
			mv = frappe.get_doc("Mobile Verification",self.mobile_no)
			if mv:
				mv.mflag = 1
				mv.save(ignore_permissions=True)
