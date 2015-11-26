import frappe
from frappe.utils import cint

@frappe.whitelist()
def get_comments(profile_id, provider_id, event_id):
	comments_list = []
	
	cond = get_cond(profile_id, provider_id)

	comments = frappe.db.sql("""select pc.creation as timespan, pc.comment_body, 
				pc.provider_id , 
				pc.provider_name as comment_maker, pc.profile_id, 
				pc.user_name, u.user_image as usr_img
			from `tabPHR Comment` pc, tabUser u
			where event_id = '%s' %s
				and u.profile_id = pc.provider_id
			order by pc.creation desc"""%(event_id, cond), as_dict=1)

	return comments

def get_cond(profile_id, provider_id):
	if provider_id == profile_id:
		return "and pc.profile_id = '%s'"%profile_id
	else:
		return "and pc.provider_id = '%s'"%provider_id

@frappe.whitelist()
def set_comment(comment, provider_id, profile_id, event_id, event_title):
	cmnt = frappe.new_doc('PHR Comment')
	cmnt.comment_body = comment
	cmnt.provider_id = provider_id
	cmnt.provider_name =  frappe.db.get_value("User", {"profile_id": provider_id}, "concat(first_name, ' ',last_name)")
	cmnt.profile_id = profile_id
	cmnt.user_name = frappe.db.get_value("User", {"profile_id": profile_id}, "concat(first_name, ' ', last_name)")
	cmnt.event_id = event_id
	cmnt.event_title = event_title
	cmnt.save()

def set_review(data):
	""" create rreview"""
	cmnt = frappe.new_doc('PHR Comment')
	cmnt.comment_body = data["review"]
	cmnt.rating = 5 if cint(data['rating']) > 5 else cint(data['rating'])
	cmnt.provider_id = data["provider_id"]
	cmnt.provider_name = data["provider_name"]
	cmnt.save(ignore_permissions=True)
	recalculate_rating(data)

def recalculate_rating(data):
	"""recalculate rating and update provider"""
	total_reviews = 0
	total_reting = 0

	#recalculate
	#frappe.db.sql() to run sql query in frappe
	for doc in frappe.db.sql("""select rating from `tabPHR Comment` 
		where provider_id = '%s'"""%data["provider_id"], as_dict=1):
		total_reting += cint(doc["rating"])
		total_reviews += 1

	#get_doc return object of existing record
	profile_name = frappe.db.get_value("Provider", {"provider_id": data["provider_id"]}, "name")
	provider = frappe.get_doc("Provider", profile_name)
	provider.provider_rating = cint(total_reting/total_reviews)

	#ignore_permissions allows save to guest user
	provider.save(ignore_permissions=True)

def get_reviews_page_count(data):
	count = frappe.db.sql("""select count(*) from `tabPHR Comment` 
		where provider_id = '%s' """%data["provider_id"])

	if count:
		return count[0][0] 
	else:
		return 0

def get_reviews(data):
	return frappe.db.sql("""select comment_body, rating from `tabPHR Comment` 
		where provider_id = '%s' order by creation desc limit %s, %s"""%(data["provider_id"], data["lower_limit"], 
			data["upper_limit"]), as_dict=1)





