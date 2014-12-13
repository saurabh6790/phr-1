# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.website.website_generator import WebsiteGenerator

class PHRForms(WebsiteGenerator):
	template = "templates/generators/forms.html"
	#condition_field = "published"
	page_title_field = "title"
	no_cache = 1
	no_sitemap = 1
	def get_context(self, context):
		form_fields=[{"label": "item Code","fieldname": "item_code","fieldtype": "data"},{"label": "Item","fieldname": "item","fieldtype": "data"}]
		context.params = frappe.form_dict
		context.fields=form_fields
		print context.fields 
		return context
