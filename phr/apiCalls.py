import frappe
import json
from frappe.utils import cstr, get_site_path, get_url
import base64
import frappe
from frappe import _
from templates.pages.utils import get_base_url
from phr.phr_api import get_response
from templates.pages.login import create_profile_in_solr,get_barcode,get_image_path


@frappe.whitelist(allow_guest=True)
def direct_order_from_patient_from_existig_prescription(data):
	"""
		1.Read data
		2.Insert prescription Assignment Log
		3. Update Ptient prescription
		Input:
		{
			"prescription_id":"value"
			"parent":"value"
			"prescription_assigned_to_chemist":"value"
			"chemist_accepted_flag":"value"
			"delivery_status":"value"
		}
	"""
	data = json.loads(data)
	chemist=frappe.get_doc("Chemist",data.get("prescription_assigned_to_chemist"))
	patient_prescription_id = data.get("prescription_id")

	logdata={
			"prescription_id":	data.get("prescription_id"),			
			"parent":data.get("prescription_id"),
			"prescription_assigned_to_chemist":chemist.profile_id,
			"chemist_accepted_flag":0,
			"delivery_status":"Assigned",
		}
	assign_prescription_to_chemist(json.dumps(logdata))
	return patient_prescription_id


@frappe.whitelist(allow_guest=True)
def getStockistOrderDetails(data):
	data = json.loads(data)
	order_id = data.get('order_id')
	return frappe.db.sql(""" select ord.name,ord.order_image_url,chem.first_name,chem.last_name,chem.mobile_number,chem.email_address,chem.address,stockist_bill_image from `tabChemist Order` ord INNER JOIN `tabChemist` chem ON ord.chemist_id=chem.profile_id INNER JOIN `tabChemist Order Delivery Log` as orderLog on ord.name=orderLog.order_id AND ord.name='%s' """%(order_id) , as_dict=1)		