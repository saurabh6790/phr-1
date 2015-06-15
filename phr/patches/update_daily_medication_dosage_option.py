from __future__ import unicode_literals
import frappe
import json 

def execute():
	for medication in frappe.db.sql_list("""select name from tabMedication 
			where dosage = "Daily" """):
		med = frappe.get_doc("Medication", medication)
		if med.options:
			option = json.loads(med.options)
			if "afternoon" not in option:
				option['afternoon'] = ""

			med.options = json.dumps(option)

			med.save(ignore_permissions=True)		