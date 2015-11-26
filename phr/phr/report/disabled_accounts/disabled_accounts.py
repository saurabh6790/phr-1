# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

def execute(filters=None):
	if not filters: filters = {}

	columns = get_columns(filters)
	user_data=get_users_data(filters)
	data = []
	for d in user_data:
		data.append([d.name,
				d.profile_id,
				d.first_name,
				d.last_name
			])

	return columns, data


def get_columns(filters):
	"""return columns based on filters"""
	columns = ["User:Link/User:100", "Profile Id::150","First Name::100", "Last Name::90"]
	return columns

def get_users_data(filters):
	conditions = get_conditions(filters)
	return frappe.db.sql("""select name, first_name, last_name, password_str, profile_id
		from `tabUser`
		where enabled=0 %s order by creation""" %
		conditions, as_dict=1)




def get_conditions(filters):
	conditions = ""
	if filters.get("user_name"):
		conditions += " and name = '%s'" % filters["user_name"]
	return conditions