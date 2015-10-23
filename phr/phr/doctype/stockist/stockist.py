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

class Stockist(Document):
	"""
		These class possesses operations of Stockist.Stockist can be created,updated.
		below is Workflow for Stockist:
		1.When Stockist is created create his login as website user and accesstype as Stockist
		2.Send Mail with password generated.
		3.Create Profile in solr as provider with type as Stockist
	"""
	def validate(self):
		"""
			1.Validate Email and Mobile Number.
			2.Check if User Exists if Exists update user if not then Create User and Profile in solr.
		"""
		try:
			if self.email_address and not re.match(r"[^@]+@[^@]+\.[^@]+", self.email_address):
				frappe.msgprint("Invalid Email Id",raise_exception=1)

			if self.mobile_number and not (self.mobile_number).isdigit():
				frappe.msgprint("Invalid Mobile Number",raise_exception=1)
			
			if not self.stockist_id:
				self.create_solr_profile()

			#if doesnot user exists then create login	
			if not self.exisitng_user():
				self.create_user_login()
				frappe.db.commit()
			elif self.exisitng_user():
				self.update_user()

		except Exception, e:
			raise Exception(e)

	def on_update(self):
		pass

	def create_solr_profile(self):
		"""
			Create Profile in solr
		"""
		request_type = "POST"
		url = get_base_url()+'createProvider'
		data = {
					"provider_type": "Stockist",
					"mobile": self.mobile_number,
					"email": self.email_address,
					'received_from': self.received_from,
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
			self.stockist_id = res['entityid']

	def create_user_login(self):
		"""
			Build User Object and Save,these method will create user
		"""
		from frappe.utils import random_string
		password = random_string(10)
		user = frappe.get_doc({
			"doctype":"User",
			"email": self.email_address,
			"profile_id": self.stockist_id,
			"first_name": self.first_name,
			"last_name":self.last_name,
			"middle_name":self.middle_name,
			"enabled": 1,
			"contact":self.mobile_number,
			"new_password": password,
			"user_type": "Website User",
			"access_type":"Stockist",#change to Stockist
			"created_via": "Desktop",
			"password_str":password
		})
		user.ignore_permissions = True
		user.no_welcome_mail = True
		user.insert()

		args = {'person_firstname':self.first_name,'person_middlename':self.middle_name,
				'person_lastname':self.last_name,'email':self.email_address,
				'mobile': self.mobile_number, "barcode":str(get_barcode())}

		notify = notify_user({}, args, self.stockist_id, send_sms=False, is_provider=True)
		
		if notify.get("returncode") == 501:
			raise Exception(notify.get('msg_display'))

	def exisitng_user(self):
		"""
			Check If User Exists.
		"""
		#change access type to Stockist
		if cint(frappe.db.sql("""select count(*) from tabUser where name = '%s'
					 """%self.email_address,as_list=1)[0][0]) > 0:
			return True
		return False

	def update_user(self, enabled=1):
		"""
			If User Exists then update the user
		"""
		if self.email_address:
			user = frappe.get_doc("User", self.email_address)
			user.enabled = enabled
			user.save()

