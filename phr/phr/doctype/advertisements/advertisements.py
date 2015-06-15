# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from phr.templates.pages.utils import send_phrs_mail, get_sms_template
from erpnext.setup.doctype.sms_settings.sms_settings import send_sms

class Advertisements(Document):
	def send_notification(self):
		adv_data = [{
			"notification_to": self.notification_to,
			"notify_via": self.notify_via,
			"ad_title": self.ad_title,
			"ad_description": self.ad_description,
			"sms_desc": self.sms_desc,
			"ad_link": self.ad_link
		}]

		classify_method(adv_data)

def classify_method(adv_data):
	sms_list = []
	emails_list = []
	for adv in adv_data:
		""" {"notify_to":[emails/numbers], "title": title, "description": description, "link": link} """
		sms_list, emails_list = get_contact_details(adv)
		
		advs = {"title": adv.get('ad_title'),
			"description": adv.get('ad_description'),
			"link": adv.get('ad_link'),
			"sms_desc": adv.get('sms_desc'),
			"access_type": "Provider/Patient" if adv.get("notification_to") == 'Both' else adv.get("notification_to")
		}
		if adv.get("notify_via") == 'Email':
			advs.update({
				"notify_to" : [email[0] for email in emails_list]
			})
			send_adv_email(advs)

		elif adv.get("notify_via") == 'SMS':
			advs.update({
				"notify_to" : [num[0] for num in sms_list]
			})
			send_adv_sms(advs)

		else:
			advs.update({
					"notify_to" : [email[0] for email in emails_list]
				})
			send_adv_email(advs)

			advs.update({
				"notify_to" : [num[0] for num in sms_list]
			})
			send_adv_sms(advs)

def get_contact_details(adv):
	contact_list = frappe.db.sql("""select contact from tabUser where contact is not null and %(cond)s"""%{
			"cond": get_cond(adv)
		},as_list=1)

	emails_list = frappe.db.sql("""select email from tabUser where %(cond)s"""%{
			"cond": get_cond(adv)
		},as_list=1)
	return contact_list, emails_list

def get_cond(adv):
	return "access_type in ('Patient', 'Provider')" if adv.get("notification_to") == 'Both' else "access_type = '%s'"%adv.get("notification_to")

def send_adv_email(adv):
	send_phrs_mail(adv.get("notify_to"), adv.get("title"), "templates/emails/adv_notify.html", adv)

def send_adv_sms(adv):
	sms = get_sms_template("Advertisement Notification", adv)
	send_sms(adv.get("notify_to"),sms)