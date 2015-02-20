import frappe
import datetime
from erpnext.setup.doctype.sms_settings.sms_settings import send_sms
from frappe.utils.email_lib import sendmail
import json
from phr.templates.pages.profile import search_profile_data_from_solr

@frappe.whitelist()
def create_todo(data):
	data = eval(data)
	
	todo = frappe.new_doc('ToDo')
	todo.profile_id = data.get('profile_id')
	todo.description = data.get('description')
	todo.owner = frappe.session.user
	todo.status = 'Open'
	todo.date = datetime.datetime.strptime(data.get('due_date'), '%d/%m/%Y').strftime('%Y-%m-%d'),
	todo.priority = data.get('priority')
	todo.save()
	
	return todo

@frappe.whitelist(allow_guest=True)
def get_todo(profile_id):
	todo_list = []
	todo = frappe.db.sql("select name from tabToDo where profile_id = '%s' order by creation desc limit 5"%profile_id)
	for td in todo:
		todo_list.append(frappe.get_doc("ToDo", td[0]))

	return todo_list

@frappe.whitelist(allow_guest=True)
def notify_to_do():
	profile_ids=get_profile_ids()
	if profile_ids:
		email_list=[]
		sms_recipients=[]
		for profile in profile_ids:
			pobj=frappe.get_doc('User',frappe.db.get_value("User",{"profile_id":profile},"name"))
			if pobj:
				sms_recipients.append(pobj.contact)
				email_list.append(pobj.name)
			else:
				data=search_profile_data_from_solr(profile)
				sms_recipients.append(data["mobile"])
				email_list.append(data["email"])
		if sms_recipients:
			send_sms(sms_recipients,msg='TO Do activity')
		if email_list:
			sendmail(email_list,subject="To Do Alert",msg="To do Notification")

def get_profile_ids():
	profile_ids=frappe.db.sql_list("""select profile_id from 
		`tabToDo` where profile_id 
		in (select profile_id 
			from `tabNotification Configuration` 
			where to_do=1) 
		and date between now() + INTERVAL 57 MINUTE 
		and now() + INTERVAL 63 MINUTE """)
	return profile_ids

