# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils import cint
from phr.templates.pages.form_generator import get_data_to_render
from phr.templates.pages.utils import get_base_url
from phr.templates.pages.login import get_barcode, notify_user
import json
import re

class Provider(Document):
	def validate(self):
		try:
			if self.email and not re.match(r"[^@]+@[^@]+\.[^@]+", self.email):
				frappe.msgprint("Invalid Email Id",raise_exception=1)

			if self.mobile_number and not (self.mobile_number).isdigit():
				frappe.msgprint("Invalid Mobile Number",raise_exception=1)

			if self.provider_category == "TieUp":
				if not self.mobile_number or not self.email:
					frappe.msgprint("Mobile Number And Email id are mandetory",raise_exception=1)

			if not self.provider_id:
				self.create_solr_profile()

			if self.provider_category == "TieUp":
				self.create_user()
				frappe.db.commit()
			else:
				if self.exisitng_user():
					self.update_user()
		except Exception, e:
			raise Exception(e)

	def on_update(self):
		pass

	def create_user(self):
		if self.exisitng_user():
			self.update_user(enabled=1)
		else:
			self.create_user_login()

	def create_solr_profile(self):
		request_type = "POST"
		url = get_base_url()+'createProvider'
		data = {
					"provider_type": self.provider_type,
					"name": self.provider_name,
					"specialization": self.specialization,
					"mobile": self.mobile_number,
					"email": self.email,
					"comments": '',
					"address1": self.address,
					"country": self.country,
					"city": self.city,
					"visiting_hours": '',
					"address2": self.address_2,
					"state": self.state,
					"pincode": self.pincode,
					'received_from': 'Desktop',
					"provider": True,
					"person_firstname":self.first_name,
					"person_middlename":self.middle_name,
					"person_lastname":self.last_name
				}

		from phr.phr.phr_api import get_response
		response = get_response(url, json.dumps(data),request_type)
		print "response",response
		res = json.loads(response.text)

		if res['returncode']==129:
			self.provider_id = res['entityid']

	def create_user_login(self):
		from frappe.utils import random_string
		password = random_string(10)
		user = frappe.get_doc({
			"doctype":"User",
			"email": self.email,
			"profile_id": self.provider_id,
			"first_name": self.first_name,
			"last_name":self.last_name,
			"middle_name":self.middle_name,
			"enabled": 1,
			"contact":self.mobile_number,
			"new_password": password,
			"user_type": "Website User",
			"access_type":"Provider",
			"created_via": "Desktop",
			"password_str":password
		})
		user.ignore_permissions = True
		user.no_welcome_mail = True
		user.insert()

		args = {'person_firstname':self.first_name,'person_middlename':self.middle_name,
				'person_lastname':self.last_name,'email':self.email,
				'mobile': self.mobile_number, "barcode":str(get_barcode())}

		notify = notify_user({}, args, self.provider_id, send_sms=False, is_provider=True)
		if notify.get("returncode") == 501:
			raise Exception(notify.get('msg_display'))

	def exisitng_user(self):
		if cint(frappe.db.sql("""select count(*) from tabUser where name = '%s'
					and access_type = "Provider" """%self.email,as_list=1)[0][0]) > 0:
			return True
		return False

	def update_user(self, enabled=1):
		if self.email:
			user = frappe.get_doc("User", self.email)
			user.enabled = enabled
			user.save()


def get_provider_profile(data):
	from frappe.utils import get_url
	from phr.templates.pages.provider import get_address

	profile_name = frappe.db.get_value("Provider", {"provider_id": data["provider_id"]}, "name")
	profile = frappe.get_doc("Provider", profile_name)

	ret_dict = {
		"provider_info": {
			"specialization": profile.specialization, 
			"provider_category": profile.provider_category, 
			"provider_name": profile.provider_name, 
			"email": profile.email, 
			"mobile_number": profile.mobile_number, 
			"provider_image": "%s%s"% (get_url(), profile.provider_image), 
			"gender": profile.gender, 
			"provider_rating": profile.provider_rating,
			"timing": profile.physical_consultation,
			"services": profile.services,
			"degree": profile.degree,
			"experience": profile.experience,
			"address": "%(address)s, %(address_2)s, %(city)s, %(state)s, %(country)s, %(pincode)s"%profile.as_dict()
		},
		"linked_address": get_address(profile.provider_id)
	}

	return ret_dict