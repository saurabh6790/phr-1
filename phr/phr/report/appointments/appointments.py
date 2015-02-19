# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

def execute(filters=None):
	if not filters: filters = {}

	columns = get_columns(filters)
	appointments=get_appointments(filters)
	data = []
	for a in appointments:
		data.append([a.profile_id,
				a.provider_name,
				a.from_date_time,
				a.reason,
				a.created_via,

			])
	return columns, data


def get_columns(filters):
	"""return columns based on filters"""
	columns = ["Profile Id::100", "Provider Name::150","Date Time::100",\
	"Reason::200", "Created Via::100"]
	return columns

def get_appointments(filters):
	conditions = get_conditions(filters)
	if conditions:
		return frappe.db.sql("""select profile_id,provider_name,from_date_time,reason,created_via
			from `tabAppointments`
			where %s order by creation""" %
			conditions, as_dict=1,debug=1)
	else:
		return frappe.db.sql("""select profile_id,provider_name,from_date_time,reason,created_via
			from `tabAppointments`
			order by creation""", as_dict=1,debug=1)

def get_conditions(filters):
	conditions = ""
	if not filters.get("from_date"):
		frappe.throw(_("'From Date' is required"))
	else:
		conditions += "from_date_time >= '%s'" % filters["from_date"]

	if filters.get("to_date") and filters.get("from_date"):
		conditions +="and from_date_time <= '%s'" % filters["to_date"]
	else:
		frappe.throw(_("'To Date' is required"))

	return conditions