# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import time
import datetime
from frappe.model.document import Document
from time import mktime
from frappe.utils import get_datetime, cstr, cint, getdate
import json

class SlotGenerator(Document):
	def generate_slot(self):
		provider_id = frappe.db.get_value("Provider", self.provider, "provider_id")
		frappe.errprint(self.slot_duration)
		for slot_detaits in self.slot_info:
			self.create_slot_entry(slot_detaits, provider_id)
			

	def create_slot_entry(self, slot_detaits, provider_id):
		def _get_datetime_obj(date, time):
			return get_datetime(cstr(date) + " " + cstr(time))

		new_time = _get_datetime_obj(slot_detaits.date, get_formated_time(slot_detaits.from_time)).time()
		to_time = _get_datetime_obj(slot_detaits.date, get_formated_time(slot_detaits.to_time)).time()

		while new_time < to_time:
			if not frappe.db.get_value("Appointment Slot", {"location_id": slot_detaits.location, 
				"provider_id": provider_id, "date": slot_detaits.date, 
				"time": new_time.strftime('%H:%M:%S')}, "name"):

				frappe.get_doc({
					"doctype": "Appointment Slot",
					"location_id": slot_detaits.location,
					"provider_id": provider_id,
					"provider_name": self.provider_name,
					"date": slot_detaits.date,
					"time": new_time,
					"status": "Open"
				}).insert()

			new_time = _get_datetime_obj(slot_detaits.date, new_time) + datetime.timedelta(minutes = cint(self.slot_duration))
			new_time = new_time.time()

def get_formated_time(str_time):
	return datetime.datetime.fromtimestamp(mktime(time.strptime(str_time, "%H:%M"))).strftime("%H:%M:%S")

def get_slot(data):
	"""
		data = {"provider_id": "1448550271875-995518", "location_id": "addr0000001", "date": "2015-12-01"}
	"""
	condition = get_condition(data)
	return get_slots(condition)

def get_condition(data):
	cond = []
	if data.get("location_id"):
		cond.append(" location_id = '%(location_id)s' "%(data))
	else:
		location_id = frappe.db.get_value("PHRAddress", {"is_primary_address": 1, 
			"provider_id": data.get("provider_id")}, "name")

		cond.append(" location_id = '%s' "%(location_id))

	if data.get("provider_id"):
		cond.append(" provider_id = '%(provider_id)s'"%(data))

	if data.get("date"):
		cond.append(" date = '%(date)s'"%(data))


	return ' and'.join(cond)

def get_slots(condition):
	return frappe.db.sql(""" select name as slot_id, location_id, provider_id, date, time, status 
		from `tabAppointment Slot` where %s order by time"""%condition, as_dict=1)

def book_appointment(data):
	"""
		data = {"slot_id": "Slot00000000007", "patient_name":"Saurabh", 
			"patient_id": "1432046733565-328100", "complaint": "This is Test"}
	"""
	doc = frappe.get_doc("Appointment Slot", data.get("slot_id"))

	if not doc.status == "Booked":
		doc.status = "Booked"
		doc.patient_id = data.get("patient_id")
		doc.patient_name = data.get("patient_name")
		doc.complaint = data.get("complaint")
		doc.save(ignore_permissions=True)

	else:
		return "Already Booked"

def reopen_appointment(data):
	"""
		data = {"slot_id": "Slot00000000007"}
	"""
	doc = frappe.get_doc("Appointment Slot", data.get("slot_id"))
	doc.status = "Open"
	doc.patient_id = ""
	doc.patient_name = ""
	doc.save(ignore_permissions=True)

	return "Appointment has been canceled for date %s at time %s"%(doc.date, doc.time)