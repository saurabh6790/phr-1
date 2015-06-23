import frappe

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