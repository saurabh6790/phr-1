# Copyright (c) 2013, indictrans and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from phr.phr.phr_api import get_response

class Events(Document):
	"""
		On creation of event in ERP create an event on solr and 
		get id of that event and save against the event.
	"""
	def on_update(self):
		request_type="POST"
		url="http://88.198.52.49:7974/phr/updateProfile"
		#response=get_response(url,data,request_type)
		pass
