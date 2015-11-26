# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from random import randint
import json


class DiseaseMonitoring(Document):
	def autoname(self):
		self.name = self.get_random_no()

	def get_random_no(self):
		return ''.join(["%s" % randint(0, 9) for num in range(0, 15)])

	def validate(self):
		self.scrub_field_names()
		self.add_date_field()

	def scrub_field_names(self):
		for d in self.get("parameters"):
			if d.label:
				if (not getattr(d, "fieldname", None)):
					if d.label:
						d.fieldname = d.label.strip().lower().replace(' ','_')
					else:
						d.fieldname = d.fieldtype.lower().replace(" ","_") + "_" + str(d.idx)

	def add_date_field(self):
		date_flag = True
		for d in self.get("parameters"):
			if 'date' == d.fieldtype.lower() or 'datetime' == d.fieldtype.lower():
				d.required = 1
				date_flag = False

		if date_flag:
			field_list = self.get("parameters")
			
			child = frappe.new_doc("Event Parameters")

			child.update({'label': "Date", 
					"fieldtype": "datetime", 
					"fieldname": "date", 
					"required": 1, 
					"parent": self.name, 
					"parentfield":'parameters',	
					"parenttype": 'Disease Monitoring',
					"idx":1
				})

			for d in field_list:
				d.idx += 1

			field_list.insert(0, child)

	def on_update(self):
		self.event_master_id=self.name

def get_diseases(doctype, txt, searchfield, start, page_len, filters):
	return frappe.db.sql("""select disease_name from `tabDisease Monitoring`""",as_list=1)
