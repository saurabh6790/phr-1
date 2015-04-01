import frappe
import json
from frappe.utils import cstr, get_site_path, get_url
import base64
import frappe

""" Profile login calls """
@frappe.whitelist(allow_guest=True)
def create_profile(data):
	from templates.pages.login import create_profile
	data = json.loads(data)
	
	res = create_profile(data.get('first_name'), data.get('middle_name'), 
			data.get('last_name'), data.get('email'), data.get('mobile_no'), "Mobile")
	
	return res

@frappe.whitelist(allow_guest=True)
def validate_mobile_code(data):
	from phr.verifier import verify_mobile
	data = json.loads(data)
	res = verify_mobile(data.get('profile_id'),data.get('verification_code'))
	return res

""" Event Calls """
@frappe.whitelist(allow_guest=True)
def get_event_name():
	return frappe.db.sql(""" select name from tabEvents """, as_dict=1)

@frappe.whitelist(allow_guest=True)
def getProfileVisitData(data):
	data = json.loads(data)

	data_dict = {'file_name': 'visit', 
			"profile_id": data.get('profile_id'), 
			'param':'listview', 
			'other_param': ''}

	from templates.pages.event import get_visit_data

	res = get_visit_data(json.dumps(data_dict))
	import re

	TAG_RE = re.compile(r'<[^>]+>')

	return eval(TAG_RE.sub('', cstr(res.get('rows')[1:])))


@frappe.whitelist(allow_guest=True)
def getProfileEventData(data):
	data = json.loads(data)

	data_dict = {'file_name': 'event', 
			"profile_id": data.get('profile_id'), 
			'param':'listview', 
			'other_param': ''}

	from templates.pages.event import get_event_data

	res = get_event_data(json.dumps(data_dict))

	import re

	TAG_RE = re.compile(r'<[^>]+>')

	return eval(TAG_RE.sub('', cstr(res.get('rows')[1:])))


"""Medication Calls"""
@frappe.whitelist(allow_guest=True)
def getMedicationFields():
	dosage_list = []
	for dosage in frappe.db.sql("select name from `tabDosage`", as_list=1):
		dosage_details = {'dosage_type': dosage[0]}
		dosage_details['fields'] = frappe.db.sql(""" select label, fieldtype, fieldname, replace(ifnull(options,''), '\n', ', ') as options
				from `tabDosage Fields` where parent = '%s' """%(dosage[0]), as_dict=1)
		dosage_list.append(dosage_details)

	return dosage_list

@frappe.whitelist(allow_guest=True)
def createMedication(data):
	from templates.pages.medication import save_data
	medication = save_data(data)
	return medication

@frappe.whitelist(allow_guest=True)
def getProfileMedications(data):
	from templates.pages.medication import fetch_values_from_db

	data = json.loads(data)

	return fetch_values_from_db(data)


"""Disease Monitoring Calls"""

@frappe.whitelist(allow_guest=True)
def getDiseaseMonitoringFields():
	disease_list = []
	for disease in frappe.db.sql("select event_master_id, disease_name from `tabDisease Monitoring`", as_list=1):
		field_mapper = ['sr']

		disease_details = {'event_master_id': disease[0], 'disease_name': disease[1]}

		dm_fields = frappe.db.sql(""" select label, fieldtype, fieldname 
				from `tabEvent Parameters` where parent = '%s' """%(disease[0]), as_dict=1)

		for field_dict in dm_fields:
			field_mapper.append(field_dict['fieldname'])			
		

		disease_details['fields'] = dm_fields
		disease_details['field_mapper'] = field_mapper
		disease_list.append(disease_details)

	return {"disease_list": disease_list}

@frappe.whitelist(allow_guest=True)
def createDiseaseMonitoring(data, arg, fields, field_mapper, raw_fields=None):
	from templates.pages.disease_monitoring import save_dm
	res = save_dm(data, arg, eval(fields), field_mapper, raw_fields=None, val_req=False)
	return res

@frappe.whitelist(allow_guest=True)
def getProfileDM(data):
	from templates.pages.disease_monitoring import get_existing_records_from_solr, get_disease_fields
	data = json.loads(data)
	# res = get_existing_records_from_solr(data.get('profile_id'), data.get('event_master_id'))
	disease_name = frappe.db.get_value("Disease Monitoring", {"event_master_id":data.get('event_master_id')}, "disease_name")
	res = get_disease_fields(disease_name, data.get('profile_id'))
	import re

	TAG_RE = re.compile(r'<[^>]+>')

	return eval(TAG_RE.sub('', cstr(res))).get('values')
	# return res

"""Appointment services"""
@frappe.whitelist(allow_guest=True)
def createAppointment(data):
	from templates.pages.appointments import save_data
	return save_data(data)

@frappe.whitelist(allow_guest=True)
def getAppointments(data):
	from templates.pages.appointments import fetch_values_from_db
	return fetch_values_from_db(json.loads(data))

"""Messages services"""
@frappe.whitelist(allow_guest=True)
def getMessages(data):
	from templates.pages.messages import fetch_values_from_db
	return fetch_values_from_db(json.loads(data))

@frappe.whitelist(allow_guest=True)
def createMessageLog(data):
	from phr.doctype.phr_activity_log.phr_activity_log import make_log
	data = json.loads(data)
	make_log(data.get('profile_id'), data.get("entity_name"), data.get('operation'), data.get("subject"))
	return "Log Created"

"""Provider services"""
@frappe.whitelist(allow_guest=True)
def get_linked_provides(data):
	from templates.pages.event import get_linked_providers
	data = json.loads(data)
	res = get_linked_providers(data.get('profile_id'))
	return res

@frappe.whitelist(allow_guest=True)
def searchProviders(data=None):
	from templates.pages.event import get_providers
	providers_list = get_providers(data)
	if providers_list:
		return providers_list
	else:
		return []
@frappe.whitelist(allow_guest=True)
def linkSelectedProvider(data):
	""" data = { 
			"res" : {"entityid":"1425266248745-498294"}, 
			"data" : {"name": "testadmin","email": "testadmin@test.com", "mobile": "1234567890"},
			"profile_id": "1421132127691-812100"
		} """

	data = json.loads(data)
	from templates.pages.provider import link_provider

	return {"link_id": link_provider(data.get('res'), data.get('data'), data.get("profile_id"))}

@frappe.whitelist(allow_guest=True)
def createProvider(data):
	from templates.pages.provider import create_provider
	data = json.loads(data)
	res = create_provider(json.dumps(data.get('data')), '', data.get('profile_id'))
	del res['actualdata']
	return res

""" Event/Visit Sharing """
@frappe.whitelist(allow_guest=True)
def sharingViaProvider(data):
	from templates.pages.event import share_via_providers_account
	data = json.loads(data)
	return share_via_providers_account(data)

@frappe.whitelist(allow_guest=True)
def sharingViaEmail(data):
	from templates.pages.event import share_via_email
	data=json.loads(data)
	res = write_docfile(data)
	return share_via_email(data)

def write_docfile(data):
	import os
	for file_path in data.get('files'):
		base_dir_path = os.path.join(os.getcwd(), get_site_path().replace('.',"").replace('/', ""), 'public', 'files')
		folder_lst = file_path.split('/')
		file_path =  '/'.join(folder_lst[:-1]) 
		doc_name = folder_lst[-1:][0]
		doc_base_path = os.path.join(base_dir_path, file_path)

		if not os.path.exists(doc_base_path + '/' +doc_name):
			frappe.create_folder(doc_base_path)
			data = {
				"entityid": folder_lst[4],
				"profile_id": folder_lst[0],
				"event_id": folder_lst[1],
				"tag_id": folder_lst[4] + '-' + cstr(folder_lst[2].split('-')[1]) + cstr(folder_lst[3].split('_')[1]),
				"file_id": [
					doc_name.replace('-watermark', '')
				],
				"file_location": [
					doc_base_path + '/' + doc_name
				]
			}

			from templates.pages.event import write_file
			res = write_file(data)

"""Service to get all dropdown"""
@frappe.whitelist(allow_guest=True)
def getDropdownMenu():
	return {
		"gender": ["Male", "Female", "Trans Gender"],
		"marital_status": ["Married", "Single"],
		"state": get_states(),
		"blood_group": ["O+","O-","A+","A-","B+","B-","AB+","AB-"],
		"diet_type": ["Vegetarian", "Non-Vegetarian"],
		"provider_type": get_provider_type(),
		"specialization": get_specialization_list(),
		"share_via": ["Email", "Provider Account"],
		"reason_for_sharing": ["Consultation", "Follow Up", "Second Opinion"],
		"tag_dict" : {'11': "consultancy-11", "12": "event_snap-12", "13": "lab_reports-13", "14":"prescription-14", "15": "cost_of_care-15"},
		"sub_tag_dict" : {
			"11":{'51':"A_51", "52":"B_52", "53":"C_53"},
			"12":{'51':"A_51", "52":"B_52"},
			"13":{'51':"A_51", "52":"B_52"},
			"14":{'51':"A_51", "52":"B_52", "53":"C_53"},
			"15":{'51':"A_51"},
		}
	}

def get_states():
	return silgle_dlist(frappe.db.sql("""select name from tabState """, as_list=1))

def get_provider_type():
	return silgle_dlist(frappe.db.sql("select name from `tabProvider Type`", as_list=1))

def get_specialization_list():
	return silgle_dlist(frappe.db.sql("select name from `tabSpecialization`", as_list=1))	

def silgle_dlist(multi_dlist):
	return [i[0] for i in multi_dlist]


"""image writer"""
@frappe.whitelist(allow_guest=True)
def image_writter(data):
	from templates.pages.event import image_writter
	return image_writter(data)

""" Profile Image Calls """
@frappe.whitelist(allow_guest=True)
def setProfileImage():
	import os
	from frappe.utils import  get_files_path
	data = json.loads(frappe.local.request.data)

	if data.get('file_name'):
		file_path = "%(files_path)s/%(profile_id)s/%(file_name)s"%{'files_path': get_files_path(), "profile_id": data.get('profile_id'),
			'file_name': data.get('file_name')
		}
		path = os.path.join(os.getcwd(), get_files_path()[2:], data.get('profile_id'))
		frappe.create_folder(path)
		with open("%s/%s"%(path,data.get('file_name')), 'wb') as f:
	 		f.write(base64.b64decode(data.get('bin_img')))

 	res = update_profile_image(data.get('profile_id'), data.get('file_name'))
 	return {"filestatus": res}

def update_profile_image(profile_id, file_name=None):
	# from templates.pages.profile import update_user_image
	# return update_user_image("/files/%s/%s"%(profile_id, file_name), profile_id)

	user_id = frappe.db.get_value('User', {'profile_id': profile_id}, 'name')
	if user_id:
		user = frappe.get_doc('User', user_id)
		user.user_image = "/files/%s/%s"%(profile_id, file_name) if file_name else ''
		user.save(ignore_permissions=True)

@frappe.whitelist(allow_guest=True)
def getProfileImage(data):
	import os
	from frappe.utils import  get_files_path
	data = json.loads(data)
	user_id = frappe.db.get_value('User', {'profile_id': data.get('profile_id')}, 'name')
	user_img = {}
	bin_img = ''

	if user_id:
		user = frappe.get_doc('User', user_id)
			
		file_name = user.user_image.split('/')[-1:][0]

		file_path = "%(files_path)s/%(profile_id)s/%(file_name)s"%{'files_path': get_files_path(), 
			"profile_id": data.get('profile_id'),
			'file_name': file_name
		}
		
		if os.path.exists(file_path):
			image = open(file_path,'rb').read()
			bin_img = base64.b64encode(image)

		else:
			from templates.pages.profile import get_user_image
			user_img = get_user_image(data.get('profile_id'))
			if not user_img.get('image'):
				user_img['image'] = ''

		return {
			"profile_id": data.get('profile_id'),
			"bin_img": bin_img,
			"file_name": file_name,
			"img_url": user_img.get('image')
		}

	else:
		return {
			'exe':"Profile Not Found"
		}


"""Patient's Emergency Details"""
@frappe.whitelist(allow_guest=True)
def getEmergencyDetails(data):
	data = json.loads(data)
	from templates.pages.profile import get_user_details
	user_details = get_user_details(data.get('profile_id'))
	if user_details.get('error'):
		return user_details
		
	user_details['barcode'] = get_url() + user_details['barcode']

	if 'files' in user_details['user_image']:
		user_details['user_image'] = get_url() + user_details['user_image']

	return user_details

"""Notification Calls"""
@frappe.whitelist(allow_guest=True)
def getNotificationFields():
	return {"fields": ["linked_phr", "to_do"]}

@frappe.whitelist(allow_guest=True)
def getEnabledNotification(data):
	data = json.loads(data)
	from templates.pages.profile import get_enabled_notification
	notfr = get_enabled_notification(data.get('profile_id'))
	if not notfr:
		notfr = {}
		fields = getNotificationFields().get('fields')
		for field in fields:
			notfr[field] = 0
		return notfr
	else:
		return notfr[0]

@frappe.whitelist(allow_guest=True)
def setNotification(data):
	data = json.loads(data)
	from templates.pages.profile import manage_notifications
	profile = {'entityid': data.get('profile_id')}
	field_list = []
	for field, val in data.get('fields').items():
		if val == 1:
			field_list.append(field)

	msg = manage_notifications(json.dumps(profile), json.dumps(field_list))

	return {
		"res": msg,
		"enabled_notification": getEnabledNotification(json.dumps(data))
	}

"""Update Password"""
@frappe.whitelist(allow_guest=True)
def updatePassword(data):
	from frappe.auth import _update_password
	data = json.loads(data)

	user = frappe.db.get_value("User",{"profile_id":data.get('profile_id')})
	_update_password(user, data.get('new_password'))

	return "Password Updated Successfully"

@frappe.whitelist(allow_guest=True)
def shareDM(data):
	share_info=json.loads(data)
	share_data=build_dm_share_data(share_info)
	from templates.pages.disease_monitoring import share_dm
	share_dm(json.dumps(share_data["data_row"]),share_data["header"],json.dumps(share_info),share_info["profile_id"],share_info["event_title"])


def build_dm_share_data(share_info):
	dm_doc=frappe.get_doc("Disease Monitoring",share_info["event_id"])
	field_dic={}
	for d in dm_doc.get('parameters'):
		field_dic[d.label]=d.fieldname
	rows=[]
	tr=""
	for label in reversed(field_dic.keys()):
		tr+="""<th>%s</th>"""%label
	
	header_row="""<tr>%s</tr>"""%tr	

	for data in share_info["data"]:
		row=""
		for label in reversed(field_dic.keys()):
			row_list=[]
			row+="""<td>%s</td>"""%data[field_dic[label]]
		rows.append(row)
	
	return {
		"header":header_row,
		"data_row":rows
	}