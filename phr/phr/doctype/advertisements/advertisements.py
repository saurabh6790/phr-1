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

		classify_method(adv_data)

def classify_method(adv_data):
	sms_list = []
	emails_list = []
	for adv in adv_data:
		""" {"notify_to":[emails/numbers], "title": title, "description": description, "link": link} """
		sms_list, emails_list = get_contact_details(adv)

		if adv.get("notify_via") == 'Email':
			send_adv_email({ 
					"notify_to" : [email[0] for email in emails_list],
					"title": adv.get('ad_title'),
					"description": adv.get('ad_description'),
					"link": adv.get('ad_link')
				})

		elif adv.get("notify_via") == 'SMS': 
			send_adv_sms({
					"notify_to" : [num[0] for num in sms_list],
					"title": adv.get('ad_title'),
					"description": adv.get('ad_description'),
					"link": adv.get('ad_link')
				})
			
		else:pass

def get_contact_details(adv):
	contact_list = frappe.db.sql("""select contact from tabUser where %(cond)s"""%{
			"cond": get_cond(adv)
		},as_list=1)

	emails_list = frappe.db.sql("""select email from tabUser where %(cond)s"""%{
			"cond": get_cond(adv)
		},as_list=1)

	return contact_list, emails_list

def get_cond(adv):
	return "access_type in ('Patient', 'Prvider')" if adv.get("notification_to") == 'Both' else "access_type = '%s'"%adv.get("notification_to")

def send_adv_email():
	pass
def send_adv_sms():
	pass