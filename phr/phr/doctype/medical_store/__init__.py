import frappe
import json



@frappe.whitelist()
def get_medical_stores(filters):
	filters = eval(filters)
	cond = get_conditions(filters)
	result_set = get_medical_stores_info(cond)
	
	return result_set

def get_conditions(filters):
	cond = []
	if filters.get('store_name'):
		cond.append('store_name like "%%%(store_name)s%%"'%filters)

	if filters.get('store_loc'):
		cond.append('address like "%%%(store_loc)s%%" or city like "%%%(store_loc)s%%" \
			or state like "%%%(store_loc)s%%" or country like "%%%(store_loc)s%%" or locality like "%%%(store_loc)s%%"'%filters)

	return ' and '.join(cond)

def get_medical_stores_info(cond):
	if cond:
		ret = frappe.db.sql("""select name,store_name, store_contact_no, store_email_address,
					store_contact_no,store_rating, 
					concat(ifnull(address,'') , ', ' ,ifnull(locality,''), ', ', ifnull(city,''), ', ', 
					ifnull(state,''), ', ', ifnull(country,''), ', ', ifnull(pin_code,'')) as store_loc
					from `tabMedical Store` where %s """%cond, as_dict=1)
		return ((len(ret[0]) > 1) and ret) if ret else None
	
	else:
		return None


def get_medical_stores_profile(data):
	from frappe.utils import get_url
	medical_store = frappe.get_doc("Medical Store", data["name"])

	ret_dict = {
		"medical_store_info": {
			"name": medical_store.name, 
			"store_name": medical_store.store_name, 
			"store_contact_no": medical_store.store_contact_no, 
			"store_email_address": medical_store.store_email_address, 
			"store_rating": medical_store.store_rating, 
			"city": medical_store.city,
			"state": medical_store.state,
			"address": "%(address)s, %(city)s, %(state)s,\
				 %(country)s, %(pin_code)s, %(locality)s"%medical_store.as_dict(),
			"store_image": "%s%s"% (get_url(), medical_store.store_image)
		},
		"delivery_team": medical_store.as_dict().get("delivery_team")

	}

	return ret_dict		