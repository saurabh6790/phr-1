# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt

def execute(filters=None):
	if not filters: filters = {}

	columns = get_columns(filters)
	meidcations=get_medications(filters)
	data = []
	for m in meidcations:
		data.append([m.profile_id,
				m.medicine_name,
				m.dosage,
				m.from_date_time,
				m.to_date_time
			])
	return columns, data


def get_columns(filters):
	"""return columns based on filters"""
	columns = ["Profile Id::100", "Medicine Name::150","Dosage::100",\
	"From Date Time::100", "To Date Time::100"]
	return columns

def get_medications(filters):
	conditions = get_conditions(filters)
	if conditions:
		return frappe.db.sql("""select profile_id,medicine_name,dosage,from_date_time,to_date_time
			from `tabMedication`
			where %s order by creation""" %
			conditions, as_dict=1,debug=1)
	else:
		return frappe.db.sql("""select profile_id,medicine_name,dosage,from_date_time,to_date_time
			from `tabMedication`
			order by creation""", as_dict=1,debug=1)

def get_conditions(filters):
	conditions = ""
	if not filters.get("from_date"):
		frappe.throw(_("'From Date' is required"))
	else:
		conditions += "from_date_time >= '%s'" % filters["from_date"]

	if filters.get("to_date") and filters.get("from_date"):
		conditions +="and to_date_time <= '%s'" % filters["to_date"]
	else:
		frappe.throw(_("'To Date' is required"))

	return conditions