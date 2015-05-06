# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils import cint
from phr.templates.pages.patient import get_base_url,get_data_to_render
import json

class Provider(Document):
	def validate(self):
		if self.provider_category == "TieUp":
			if not self.mobile_number or not self.email:
				frappe.msgprint("Mobile Number And Email id are mandetory",raise_exception=1)

	def on_update(self):
		if self.provider_category == "TieUp":
			self.create_user()
			frappe.db.commit()
		else:
			if self.exisitng_user():
				self.update_user()

	def create_user(self):
		if self.exisitng_user():
			self.update_user(enabled=1)

		else:
			if not self.provider_id:
				self.create_solr_profile()
				self.create_user_login()
			else:
				self.create_user_login()

	def create_solr_profile(self):
		request_type="POST"
		url=get_base_url()+'createProvider'
		
		data = {"provider_type": self.provider_type, "name": self.provider_name, "specialization": self.specialization, "mobile": self.mobile_number, 
		"email": self.email, "comments": '', "address1": self.address, "country": self.country, "city": self.city, "visiting_hours": '', 
		"address2": self.address_2, "state": self.state, "pincode": self.pincode, 'received_from': 'Desktop', "provider": True}

		from phr.phr.phr_api import get_response
		response=get_response(url, json.dumps(data),request_type)
		res=json.loads(response.text)

		if res['returncode']==129:
			self.profile_id = res['entityid']

	def create_user_login(self):
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