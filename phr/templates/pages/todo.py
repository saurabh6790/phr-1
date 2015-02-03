import frappe
import datetime

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

@frappe.whitelist()
def get_todo(profile_id):
	todo_list = []
	todo = frappe.db.sql("select name from tabToDo where profile_id = '%s'"%profile_id)
	for td in todo:
		todo_list.append(frappe.get_doc("ToDo", td[0]))

	return todo_list

