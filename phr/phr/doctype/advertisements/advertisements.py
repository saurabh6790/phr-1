# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class Advertisements(Document):
	def send_notification(self):
		adv_data = [{
			"notification_to": self.notification_to,
			"notify_via": self.notify_via,
			"ad_title": self.ad_title,
			"ad_description": self.ad_description,
			"ad_link": self.ad_link
		}]
		
		clsify_method(adv_data)

def clsify_method():
	pass
def send_adv_email():
	pass
def send_adv_sms():
	pass

