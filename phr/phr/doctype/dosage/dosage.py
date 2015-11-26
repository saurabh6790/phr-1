# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from phr.templates.pages.form_generator import get_json_data,write_json_data
import json

class Dosage(Document):
	def validate(self):
		self.scrub_field_names()
		self.update_json()

	def scrub_field_names(self):
		for d in self.get("dosage_fields"):
			if d.fieldtype:
				if (not getattr(d, "fieldname", None)):
					if d.label:
						d.fieldname = d.label.strip().lower().replace(' ','_')
					else:
						d.fieldname = d.fieldtype.lower().replace(" ","_") + "_" + str(d.idx)


	def update_json(self):
		doc=get_json_data("medication")
		fields_dic=self.make_dic()
		jdoc=self.append_fields_to_json(doc,fields_dic)
		#master_list=self.update_master_list(jdoc,fields_dic)
		write_json_data("medication",jdoc)


	def make_dic(self):
		fields=[]
		depends_on="dosage_type"+":"+self.name
		for d in self.get('dosage_fields'):
			f_dic={"fieldname":d.fieldname,"fieldtype":d.fieldtype,"label":d.label,"depends_on":depends_on,"placeholder":""}
			if d.options:
				opts=d.options.split("\n")
				#opt=json.dumps(opts)
				f_dic["options"]=opts

			fields.append(f_dic)
		return fields
		

	def append_fields_to_json(self,doc,fields_dic):
		list_view=doc["listview"]
		for d in reversed(fields_dic):
			if not any(lv['fieldname'] == d["fieldname"] for lv in list_view):
				doc["listview"].insert(2,d)
		return doc
		