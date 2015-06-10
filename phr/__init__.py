import frappe
import json
from frappe.utils import cstr, get_site_path, get_url
import base64
import frappe
from templates.pages.utils import get_base_url
from phr.phr_api import get_response
from templates.pages.login import create_profile_in_solr,get_barcode,get_image_path

""" Profile login calls """
@frappe.whitelist(allow_guest=True)
def create_profile(data):
	from templates.pages.login import create_profile
	data = json.loads(data)
	
	res = create_profile(data.get('first_name'), data.get('middle_name'), 
			data.get('last_name'), data.get('email'), data.get('mobile_no'), "Mobile")
	
	return res

@frappe.whitelist(allow_guest=True)
def updateProfile(data):
	from templates.pages.profile import update_profile_solr, make_mv_entry

	data = json.loads(data)
	res = update_profile_solr(json.dumps(data))

	if res.get('rtcode') == 100:
		make_mv_entry(res.get('mob_no'), data.get('entityid'))
		return res
	else: return res

@frappe.whitelist(allow_guest=True)
def validate_mobile_code(data):
	from phr.verifier import verify_mobile
	data = json.loads(data)
	res = verify_mobile(data.get('profile_id'),data.get('verification_code'))
	return res

""" Social Login """
@frappe.whitelist(allow_guest=True)
def socialLogin(data, provider=None):
	data = json.loads(data)
	login_oauth_user(data.get('response'), data.get('provider'))

	return frappe.response

class SignupDisabledError(frappe.PermissionError): pass

no_cache = True

def login_oauth_user(data, provider=None):
	if data.has_key("email"):
		user = data["email"]
		try:
			update_oauth_user(user, data, provider)
		except SignupDisabledError:
			return frappe.respond_as_web_page("Signup is Disabled", "Sorry. Signup from Website is disabled.",
				success=False, http_status_code=403)

		frappe.local.login_manager.user = user
		frappe.local.login_manager.post_login()
		frappe.db.commit()


def update_oauth_user(user, data, provider):
	if isinstance(data.get("location"), dict):
		data["location"] = data.get("location").get("name")

	save = False
	barcode=get_barcode()
	args={
		"person_firstname":data.get("first_name") or data.get("given_name") or data.get("name"),
		"person_middlename":"add",
		"person_lastname": data.get("last_name") or data.get("family_name"),
		"email":data.get("email"),
		"mobile":"",
		"received_from":"Desktop",
		"provider":"false",
		"barcode":str(barcode)
	}

	if not frappe.db.exists("User", user):
		# is signup disabled?
		if frappe.utils.cint(frappe.db.get_single_value("Website Settings", "disable_signup")):
			raise SignupDisabledError
		
		profile_res=create_profile_in_solr(args)
		response=json.loads(profile_res)
		if response['returncode']==101:
			path=get_image_path(barcode,response['entityid'])
			file_path='/files/'+response['entityid']+'/'+response['entityid']+".svg"
			save = True
			user = frappe.new_doc("User")
			user.update({
				"doctype":"User",
				"profile_id":response['entityid'],
				"first_name": data.get("first_name") or data.get("given_name") or data.get("name"),
				"last_name": data.get("last_name") or data.get("family_name"),
				"email": data["email"],
				"gender": (data.get("gender") or "").title(),
				"enabled": 1,
				"new_password": frappe.generate_hash(data["email"]),
				"location": data.get("location"),
				"user_type": "Website User",
				"access_type":"Patient",
				"user_image": data.get("picture") or data.get("avatar_url"),
				"created_via":"Desktop",
				"barcode":file_path
			})
		else:
			save = True
			user = frappe.new_doc("User")
			user.update({
				"doctype":"User",
				"first_name": data.get("first_name") or data.get("given_name") or data.get("name"),
				"last_name": data.get("last_name") or data.get("family_name"),
				"email": data["email"],
				"gender": (data.get("gender") or "").title(),
				"enabled": 1,
				"new_password": frappe.generate_hash(data["email"]),
				"location": data.get("location"),
				"user_type": "Website User",
				"user_image": data.get("picture") or data.get("avatar_url")
			})

	else:
		user = frappe.get_doc("User", user)
		save = True
		if not user.profile_id and not user.access_type=="Provider":
			profile_res=create_profile_in_solr(args)
			if response['returncode']==101:
				path=get_image_path(barcode,response['entityid'])
				file_path='/files/'+response['entityid']+'/'+response['entityid']+".svg"
				if not barcode:
					user.update({
						"barcode":file_path,
						"profile_id":response['entityid']
					})
				else:
					user.update({
						"profile_id":response['entityid']
					}) 


	if provider=="facebook" and not user.get("fb_userid"):
		save = True
		user.update({
			"fb_username": data.get("username"),
			"fb_userid": data["id"],
			"user_image": "https://graph.facebook.com/{id}/picture".format(id=data["id"])
		})

	elif provider=="google" and not user.get("google_userid"):
		save = True
		user.google_userid = data["id"]

	elif provider=="github" and not user.get("github_userid"):
		save = True
		user.github_userid = data["id"]
		user.github_username = data["login"]

	if save:
		user.ignore_permissions = True
		user.no_welcome_mail = True
		user.save()

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

@frappe.whitelist(allow_guest=True)
def searchEvent(data):
	data = json.loads(data)

	from templates.pages.event import get_individual_event_count_for_badges
	
	request_type="POST"
	url=get_base_url()+'/searchEvent'
	args={"entityid":data.get("entityid")}
	response=get_response(url,json.dumps(args),request_type)
	event_data = response.text
	bucket_count = get_individual_event_count_for_badges(data.get("entityid"), data.get("profile_id"))
	linked_provider = get_linked_provides(json.dumps(data))

	return {"event":json.loads(event_data), "bucket_count": bucket_count, "linked_provider": linked_provider}

"""Medication Calls"""
@frappe.whitelist(allow_guest=True)
def getMedicationFields():
	dosage_list = []
	for dosage in frappe.db.sql("select name from `tabDosage`", as_list=1):
		dosage_details = {'dosage_type': dosage[0]}
		dosage_details['fields'] = frappe.db.sql(""" select label, fieldtype, fieldname, replace(ifnull(options,''), '\n', ', ') as options
				from `tabDosage Fields` where parent = '%s' order by idx"""%(dosage[0]), as_dict=1)
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
				from `tabEvent Parameters` where parent = '%s' order by idx"""%(disease[0]), as_dict=1)

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
	res = get_existing_records_from_solr(data.get('profile_id'), data.get('event_master_id'))
	return res

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
	import datetime
	from templates.pages.messages import fetch_values_from_db
	log_details = fetch_values_from_db(json.loads(data))
	
	for log in log_details:
		log.creation = datetime.datetime.strptime(log.creation, '%Y-%m-%d %H:%M:%S.%f').strftime('%d/%m/%Y %H:%M')
	
	return log_details

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
	from templates.pages.provider import link_provider, check_existing_provider
	if check_existing_provider(data.get('res').get('entityid'), data.get('profile_id')):
		return {'exe': "Provider Already linked"}

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
	from templates.pages.dashboard import get_user_details
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
	from templates.pages.profile import update_password
	data = json.loads(data)

	usrobj = {
		"old_password": data.get('old_password'),
		"new_password": data.get('new_password'),
		"entityid" : data.get('profile_id'),
		"cnf_new_password": data.get('cnf_new_password')
	}

	return update_password(json.dumps(usrobj))

@frappe.whitelist(allow_guest=True)
def shareDM(data):
	share_info=json.loads(data)
	share_data=build_dm_share_data(share_info)
	from templates.pages.disease_monitoring import share_dm
	return share_dm(json.dumps(share_data["data_row"]), share_data["header"], json.dumps(share_info), \
		share_info["profile_id"], share_info["event_title"])

def build_dm_share_data(share_info):
	dm_doc=frappe.get_doc("Disease Monitoring",share_info["event_id"])
	field_dic={}
	for d in dm_doc.get('parameters'):
		field_dic[d.label]=d.fieldname
	rows=[]
	tr = "<th></th>"
	for label in reversed(field_dic.keys()):
		tr += """<th>%s</th>"""%label
	
	header_row="""<tr>%s</tr>"""%tr	

	for data in share_info["data"]:
		row = "<td></td>"
		for label in reversed(field_dic.keys()):
			row_list=[]
			row+="""<td>%s</td>"""%data[field_dic[label]]
		rows.append(row)
	
	return {
		"header":header_row,
		"data_row":rows
	}

@frappe.whitelist(allow_guest=True)
def deactivateMedication(data):
	from templates.pages.medication import update_status
	data = json.loads(data)
	
	data['file_name']="medication"
	data['param']="listview"

	if not_matching_docname(data):
		return "Maintioned medication docname is not matching with profile id"

	data = json.dumps(data)

	res = update_status(data)
	return getProfileMedications(data)

def not_matching_docname(data):
	medication_list = frappe.db.sql("select name from tabMedication where profile_id = '%s'"%data.get('profile_id'), as_list=1)
	if [data.get('docname')] not in medication_list:
		return True
	return False

@frappe.whitelist(allow_guest=True)
def getAdvertisements():
	return frappe.db.sql("""select ad_title, ad_link, ad_description from tabAdvertisements 
		where ifnull(status,'') = 'Active'""", as_dict=1)

@frappe.whitelist(allow_guest=True)
def createLinkedPHR(data):
	from templates.pages.linked_phr import create_linkedphr
	from templates.pages.profile import make_mv_entry
	data = json.loads(data)
	res = create_linkedphr(json.dumps(data))

	if res.get('returncode') == 122 and data.get('mobile'):
		make_mv_entry(data.get('mobile'), res.get('entityid'))

	return {
		"returncode": res.get('returncode'),
		"actualdata": json.loads(res.get('actualdata')),
		"entityid": res.get('entityid'),
		"message_summary": res.get('message_summary')
	}
