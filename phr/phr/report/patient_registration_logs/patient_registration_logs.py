# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

def execute(filters=None):
	if not filters: filters = {}

	columns = get_columns(filters)
	logs=get_verification_log(filters)
	data = []
	for log in logs:
		data.append([
				log.name,
				log.email,
				log.temp_password,
				log.mobile_verification_code,
				log.mflag,
				log.pwdflag,
				log.created_via,
				log.hash,
				log.verification_link
			])
	return columns, data


def get_columns(filters):
	"""return columns based on filters"""
	columns = ["Name:Link/Verification Details:100","Email::100", "Temp Password::150","Mobile Verification Code::100",\
	"Mobile Verified::100", "Password Verified::100",\
	"Created Via::100","Hash::100","Verification Link::100"]
	return columns

def get_verification_log(filters):
	conditions = get_conditions(filters)
	if conditions:
		return frappe.db.sql("""select email,temp_password,mobile_verification_code,temp_password, mflag,
			pwdflag,hash,verification_link,created_via,name	
			from `tabVerification Details`
			where %s order by creation""" %
			conditions, as_dict=1)
	else:
		return frappe.db.sql("""select email,temp_password,mobile_verification_code,temp_password, mflag,
			pwdflag,hash,verification_link,created_via,name	
			from `tabVerification Details` order by creation""", as_dict=1)

def get_conditions(filters):
	conditions = ""
	if filters.get("user_name"):
		conditions += " email= '%s'" % filters["user_name"]
	return conditions