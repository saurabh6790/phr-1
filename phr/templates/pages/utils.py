from __future__ import unicode_literals
import frappe
from frappe.core.doctype.user.user import STANDARD_USERS
from frappe.utils import cint,cstr
import datetime

""" Solr api address """
@frappe.whitelist(allow_guest=True)
def get_base_url():
	return "http://192.168.5.18:9090/phr-api/"
	#return "http://88.198.52.49:7974/phr-api/"
	# return "http://115.113.66.90:8989/phr-api/"

@frappe.whitelist(allow_guest=True)
def get_master_details(doctype):
	import itertools 
	ret = frappe.db.sql("""select name from `tab%s` 
		order by creation desc """%doctype,as_list=1,debug=1)
	return list(itertools.chain(*ret))


@frappe.whitelist(allow_guest=True)
def send_phrs_mail(recipient,subject, template, add_args):

	from frappe.utils.user import get_user_fullname
	from frappe.utils import get_url

	title = frappe.db.get_default('company') or ""

	full_name = get_user_fullname(frappe.session['user'])
	if full_name == "Guest":
		full_name = "Administrator"

	args = {
		'title': title,
		'user_fullname': full_name
	}

	args.update(add_args)

	sender = frappe.session.user not in STANDARD_USERS and frappe.session.user or None

	frappe.sendmail(recipients=recipient, sender=sender, subject=subject,
		message=frappe.get_template(template).render(args))

@frappe.whitelist(allow_guest=True)
def get_formatted_date_time(strdate=None):
	if strdate:
		return datetime.datetime.strptime(strdate,"%Y-%m-%d %H:%M:%S").strftime('%d/%m/%Y %H:%M')

@frappe.whitelist(allow_guest=True)
def formatted_date(strdate=None):
	if strdate:
		return datetime.datetime.strptime(strdate,"%Y-%m-%d").strftime('%d/%m/%Y')

@frappe.whitelist(allow_guest=True)
def get_sms_template(name,args):
	import re
	template = frappe.db.get_value("Message Templates",{"name":name},"message_body")
	tempStr = ""
	if template:
		for key in re.findall(r"(?<=\[)(.*?)(?=\])",template):
			old = "[%s]"%key
			new = cstr(args.get(key))
			template = template.replace(old, new)
		return template


@frappe.whitelist(allow_guest=True)
def send_phr_sms(mobile,msg):
	from erpnext.setup.doctype.sms_settings.sms_settings import send_sms
	if frappe.db.get_value("Mobile Verification",{"mobile_no":mobile,"mflag":1},"name"):
		no_list = []
		no_list.append(mobile)
		frappe.errprint("Sending SMS.......")
		send_sms(no_list,msg=msg)
