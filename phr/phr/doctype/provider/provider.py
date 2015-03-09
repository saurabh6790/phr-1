# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils import cint

class Provider(Document):
	def validate(self):
		if self.provider_category == "TieUp":
			if not self.mobile_number or not self.email:
				frappe.msgprint("Mobile Number And Email id are mandetory",raise_exception=1)

	def on_update(self):
		if self.provider_category == "TieUp":
			self.create_user()
		else:
			if self.exisitng_user():
				self.update_user()

	def create_user(self):
		if self.exisitng_user():
			self.update_user(enabled=1)

		else:
			from frappe.utils import random_string
			password=random_string(10)
			user = frappe.get_doc({
				"doctype":"User",
				"email": self.email,
				"profile_id": self.provider_id,
				"first_name": self.provider_name,
				"enabled": 1,
				"contact":self.mobile_number,
				"new_password": password,
				"user_type": "Website User",
				"access_type":"Provider",
				"created_via": "Desktop",
				"password_str":password
			})
			user.ignore_permissions = True
			user.insert()

	def exisitng_user(self):
		if cint(frappe.db.sql("""select count(*) 
				from tabUser where name = '%s'
			"""%self.email,as_list=1)[0][0]) > 0:
			return True

		return False

	def update_user(self, enabled=0):
		if self.email:
			user = frappe.get_doc("User", self.email)
			user.enabled = enabled
			user.save()