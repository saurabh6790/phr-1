import frappe
import datetime
from erpnext.setup.doctype.sms_settings.sms_settings import send_sms
from frappe.utils.email_lib import sendmail
import json
from phr.templates.pages.profile import search_profile_data_from_solr
from phr.templates.pages.patient import send_phrs_mail,get_formatted_date_time,get_sms_template


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
		td=frappe.get_doc("ToDo", td[0])
		todo_list.append({"desc": td.description, "todo_id": td.name,"date":get_formatted_date_time(td.date)})

	return todo_list

@frappe.whitelist(allow_guest=True)
def notify_to_do():
	print "############################~~~~~~~~~~~~todo~~~~~~~~~~~~~~~~~~~############"
	profile_ids=get_profile_ids()
	if profile_ids:
		email_list=[]
		sms_recipients=[]
		msg={}
		email_msg={}
		for profile in profile_ids:
			pobj=frappe.get_doc('User',frappe.db.get_value("User",{"profile_id":profile['profile_id']},"name"))
			todoobj=frappe.get_doc('ToDo',profile['name'])
			if pobj:
				sms_recipients.append(pobj.contact)
				email_list.append(pobj.name)
				msg[pobj.contact]=get_sms_template("todo",{"to_do":todoobj.description})
				email_msg[pobj.name]=todoobj.description
				print pobj.name
			else:
				data=search_profile_data_from_solr(profile)
				if data['mobile']:
					sms_recipients.append(data["mobile"])
					msg[data['mobile']]=get_sms_template("todo",{"to_do":todoobj.description})
				if data['email']:
					email_list.append(data["email"])
					email_msg[data["email"]]=todoobj.description
		if sms_recipients:
			for no in sms_recipients:
				mob_no=[]
				mob_no.append(no)
				send_sms(sms_recipients,msg=msg[no])
		if email_list:
			for email in email_list:
				print email_msg[email]
				send_phrs_mail(email,"PHR:To Do Alert","templates/emails/todo.html",{"todo":email_msg[email]})

def get_profile_ids():
	profile_ids=frappe.db.sql("""select profile_id,name from 
		`tabToDo` where profile_id 
		in (select profile_id 
			from `tabNotification Configuration` 
			where to_do=1) 
		and date between now() + INTERVAL 57 MINUTE 
		and now() + INTERVAL 63 MINUTE """,as_dict=1)
	return profile_ids

