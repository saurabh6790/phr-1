
from __future__ import unicode_literals
import frappe
from frappe.core.doctype.user.user import STANDARD_USERS
from frappe.utils import cint
import json
import requests

@frappe.whitelist(allow_guest=True)
def get_response(url,data,request_type):
	# from frappe.templates.pages.encryption import encrypt_msg
	# msg=encrypt_msg()
	url = url
	#jsonobj=json.dumps(args)
	jsonobj=data
	headers = {"content-type": "application/x-www-form-urlencoded"}
	if request_type=='POST':
		try:
			print "URL : ",url,"JSONOBJ : ",jsonobj,"HEADERS", headers
			response = requests.post(url, data=jsonobj, headers=headers)
		except Exception, e:
			return "No Connection"
			# return {
			# 	"returncode" : 501,
			# 	"message_summary":"Can not reach to Solr Server, Please Contact Administrator.",
			# 	"msg_display":"Can not connect to server, Please Contact Administrator"
			# }
	# elif request_type=='GET':
	#  	response = requests.get(url,headers=headers,'GET')
	return response
