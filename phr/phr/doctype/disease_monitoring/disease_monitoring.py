# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from random import randint


class DiseaseMonitoring(Document):
	def autoname(self):
		self.name = self.get_random_no()

	def get_random_no(self):
		return ''.join(["%s" % randint(0, 9) for num in range(0, 15)])

	def validate(self):
		self.scrub_field_names()

	def scrub_field_names(self):
		for d in self.get("parameters"):
			if d.label:
				if (not getattr(d, "fieldname", None)):
					if d.label:
						d.fieldname = d.label.strip().lower().replace(' ','_')
					else:
						d.fieldname = d.fieldtype.lower().replace(" ","_") + "_" + str(d.idx)

	def on_update(self):
		self.event_master_id=self.name