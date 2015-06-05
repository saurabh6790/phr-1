import frappe
import datetime
from erpnext.setup.doctype.sms_settings.sms_settings import send_sms
from frappe.utils.email_lib import sendmail
import json
from phr.templates.pages.profile import search_profile_data_from_solr
from phr.templates.pages.patient import send_phrs_mail,get_formatted_date_time,get_sms_template,send_phr_sms


@frappe.whitelist()
def create_todo(data):
	data = eval(data)
	
	todo = frappe.new_doc('ToDo')
	todo.profile_id = data.get('profile_id')
	todo.description = data.get('description')
	todo.owner = frappe.session.user
	todo.status = 'Open'
	todo.date = datetime.datetime.strptime(data.get('due_date'), '%d/%m/%Y %H:%M').strftime('%Y-%m-%d %H:%M:%S'),
	todo.priority = data.get('priority')
	todo.save()
	
	return todo

@frappe.whitelist(allow_guest=True)
def get_todo(profile_id):
	todo_list = []
	todo = frappe.db.sql("select name from tabToDo where profile_id = '%s' and date >= CURDATE() order by creation desc limit 5"%profile_id)
	for td in todo:
		td = frappe.get_doc("ToDo", td[0])
		todo_list.append({"desc": td.description, "todo_id": td.name,"date":get_formatted_date_time(td.date),"priority":td.priority})

	return todo_list

@frappe.whitelist(allow_guest=True)
def notify_to_do():
	profile_ids = get_profile_ids()
	print "########## TODO #############"
	print profile_ids
	if profile_ids:
		msg={}
		email_msg={}
		for profile in profile_ids:
			user = frappe.db.get_value("User",{"profile_id":profile['profile_id']},"name")
			todoobj = frappe.get_doc('ToDo',profile['name'])
			msgg = get_sms_template("todo",{"to_do":todoobj.description})
			if user:
				pobj = frappe.get_doc('User',user)
				send_phr_sms(pobj.contact,msg=msgg)
				send_phrs_mail(pobj.name,"PHR:To Do Alert","templates/emails/todo.html",{"todo":todoobj.description,"name":pobj.first_name})
			else:
				data = search_profile_data_from_solr(profile['profile_id'])
				
				if data:
					child = data['childProfile']
					if child['mobile'] and frappe.db.get_value("Mobile Verification",{"mobile_no":child['mobile'],"mflag":1},"name"):
						send_phr_sms(child['mobile'],msg=msgg)
					else:
						parent = data['parentProfile']
						send_phr_sms(parent['mobile'],msg=msgg)
					
					if child['email']:
						send_phrs_mail(child['email'],"PHR:To Do Alert","templates/emails/todo.html",{"todo":todoobj.description,"name":data["person_firstname"]})
					else:
						send_phrs_mail(parent['email'],"PHR:To Do Alert","templates/emails/todo.html",{"todo":todoobj.description,"name":data["person_firstname"]})	
		
def get_profile_ids():
	profile_ids=frappe.db.sql("""select profile_id,name from 
		`tabToDo` where profile_id 
		in (select profile_id 
			from `tabNotification Configuration` 
			where to_do=1) 
		and date between now() + INTERVAL 57 MINUTE 
		and now() + INTERVAL 62 MINUTE """,as_dict=1)
	return profile_ids

