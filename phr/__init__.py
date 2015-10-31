import frappe
import json
from frappe.utils import cstr, get_site_path, get_url
import base64
import frappe
from frappe import _
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
	from templates.pages.profile import update_profile_solr, make_mv_entry,send_mobile_v_code

	data = json.loads(data)
	res = update_profile_solr(json.dumps(data))

	if res.get('rtcode') == 100:
		mob_code = make_mv_entry(res.get('mob_no'), data.get('entityid'))
		if mob_code:
			send_mobile_v_code(res.get('mob_no'),data.get('entityid'),mob_code)
		return res
	else: return res

@frappe.whitelist(allow_guest=True)
def deLinkProfile(data):
	"""
		1. check for duplicate profile
		2. delink from solr
		3. create profile on frappe
	"""
	import json
	from templates.pages.profile import check_existing, delink_phr_solr
	data = json.loads(data)
	msg = check_existing(data['email'], data['mobile'])
	if not msg:
		res = delink_phr(data)
		if res.get('returncode') == 121:
			return createProfile(res, data)
		else:
			{"msg": "Something went wrong. Please try again."}
	else:
		return msg

def delink_phr(data):
	"""
		def delink_phr_solr(data,id,profile_id,res)

			id = child_id
			profile_id = parent_id
			res = ip data dict
	"""
	from templates.pages.profile import delink_phr_solr
	res = delink_phr_solr(data.get("child_id"), data.get("parent_id"), json.dumps(data))
	return res

def createProfile(solr_res, data):
	from templates.pages.profile import add_profile_to_db
	return {"msg":add_profile_to_db(json.dumps(solr_res), data.get("profile_id"))}

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
def getPrescriptionsData(data):
	data = json.loads(data)
	chemist_id = data.get('chemist_id')
	status = data.get('status')
	return frappe.db.sql(""" select presc.name as prescription_id,prescLog.name as prescription_log_id,user.contact as mobile_number,user.first_name,user.last_name from `tabPatient Prescriptions` presc INNER JOIN `tabPrescription Assignment Log` prescLog ON prescLog.parent=presc.name INNER JOIN tabUser user on presc.patient_id=user.profile_id where delivery_status='%s' AND prescription_assigned_to_chemist='%s' """%(status,chemist_id) , as_dict=1)

@frappe.whitelist(allow_guest=True)
def rejectPrescription(data):
	data = json.loads(data)
	prescription_log_id = data.get("prescription_log_id");
	frappe.db.sql(""" update `tabPrescription Assignment Log` 
		set delivery_status = "Rejected By Chemist" 
		where name ='%s'"""%(prescription_log_id))
	frappe.db.commit()
	return data

@frappe.whitelist(allow_guest=True)
def getPrescriptionDetails(data):
	data = json.loads(data)
	prescription_log_id = data.get('prescription_log_id')
	return frappe.db.sql(""" select presc.prescription_image_url,user.contact as mobile_number,user.first_name,user.last_name from `tabPatient Prescriptions` presc INNER JOIN `tabPrescription Assignment Log` prescLog ON prescLog.parent=presc.name INNER JOIN tabUser user on presc.patient_id=user.profile_id where prescLog.name='%s'  """%(prescription_log_id) , as_dict=1)


@frappe.whitelist(allow_guest=True)
def getStockistOrders(data):
	data = json.loads(data)
	stockist_id = data.get('stockist_id')
	status = data.get('status')
	return frappe.db.sql(""" select ord.name,chem.first_name,chem.last_name,chem.mobile_number from `tabChemist Order` ord INNER JOIN `tabChemist` chem ON ord.chemist_id=chem.profile_id AND order_status='%s' AND ord.stockist_id='%s'  """%(status,stockist_id) , as_dict=1)

@frappe.whitelist(allow_guest=True)
def getDoctorsAppointments(data):
	data = json.loads(data)
	provider_id = data.get('provider_id')
	status = data.get('status')
	return frappe.db.sql(""" select appt.profile_id as patient_id,appt.name,user.contact as mobile_number,user.first_name,user.last_name,DATE_FORMAT(from_date_time,'%%d-%%b-%%Y') as appointment_date,DATE_FORMAT(from_date_time,'%%r') as appointment_time from `tabAppointments` appt INNER JOIN tabUser user on appt.profile_id=user.profile_id where appt.provider_id='%s'  AND appt.status='%s' """%(provider_id,status) , as_dict=1)

@frappe.whitelist(allow_guest=True)
def getStockistOrderDetails(data):
	data = json.loads(data)
	order_id = data.get('order_id')
	return frappe.db.sql(""" select ord.name,ord.order_image_url,chem.first_name,chem.last_name,chem.mobile_number,chem.email_address,chem.address from `tabChemist Order` ord INNER JOIN `tabChemist` chem ON ord.chemist_id=chem.profile_id AND ord.name='%s' """%(order_id) , as_dict=1)	

@frappe.whitelist(allow_guest=True)
def getListOfOrdersPlacedByChemist(data):
	data = json.loads(data)
	chemist_id = data.get('chemist_id')
	order_status = data.get('order_status')
	return frappe.db.sql(""" select ord.name,ord.order_image_url,stck.first_name,stck.last_name,ord.order_description,ord.expected_delivery_date,ord.order_status from `tabChemist Order` ord INNER JOIN `tabStockist` stck ON ord.stockist_id=stck.stockist_id AND ord.chemist_id='%s' AND ord.order_status in %s """%(chemist_id,order_status) , as_dict=1)		

@frappe.whitelist(allow_guest=True)
def getDetailsOfOrdersPlacedByChemist(data):
	data = json.loads(data)
	order_id = data.get('order_id')
	return frappe.db.sql(""" select ord.name,ord.order_image_url,stck.first_name,stck.last_name,ord.order_description,ord.expected_delivery_date,ord.order_status from `tabChemist Order` ord INNER JOIN `tabStockist` stck ON ord.stockist_id=stck.stockist_id AND ord.name='%s' """%(order_id) , as_dict=1)			

@frappe.whitelist(allow_guest=True)
def setAcceptOrderByChemist(data):	
	data = json.loads(data)
	order_id = data.get("order_id")
	order_status = data.get("order_status")
	rejection_reason = data.get("reason")
	order_log = frappe.get_doc("Chemist Order",order_id)
	order_log.order_status= order_status
	order_log.comments= rejection_reason
	order_log.save(ignore_permissions=True)
	return ""
	# return frappe.db.sql(""" select ord.name,ord.order_image_url,stck.first_name,stck.last_name,ord.order_description,ord.expected_delivery_date,ord.order_status from `tabChemist Order` ord INNER JOIN `tabStockist` stck ON ord.stockist_id=stck.stockist_id AND ord.name='%s' """%(order_id) , as_dict=1)			


@frappe.whitelist(allow_guest=True)
def getChemistDeliveryBoys(data):
	data = json.loads(data)
	chemist_id = data.get('chemist_id')
	return frappe.db.sql(""" select team.name,team.first_name,team.last_name,team.last_name from `tabChemist Delivery Team` team INNER JOIN `tabChemist` chem ON chem.name=team.parent AND chem.profile_id='%s' """%(chemist_id) , as_dict=1)			

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

@frappe.whitelist(allow_guest=True)
def searchVisit(data):
	data = json.loads(data)

	from templates.pages.event import get_individual_visit_count_for_badges
	
	request_type="POST"
	url=get_base_url()+'/searchVisit'
	args={"entityid":data.get("entityid")}
	response=get_response(url,json.dumps(args),request_type)
	
	visit_data = json.loads(response.text).pop("actualdata")
	bucket_count = get_individual_visit_count_for_badges(data.get("entityid"), data.get("profile_id"))
	linked_provider = get_linked_provides(json.dumps(data))

	return {"visit":json.loads(visit_data), "bucket_count": bucket_count, "linked_provider": linked_provider}

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
	from templates.pages.medication import make_medication_entry
	
	data = json.loads(data)
	data['received_from'] = "Mobile"

	medication = make_medication_entry(json.dumps(data))
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
	import re

	TAG_RE = re.compile(r'<[^>]+>')
	log_details = fetch_values_from_db(json.loads(data))
	
	for log in log_details:
		log.creation = datetime.datetime.strptime(log.creation, '%Y-%m-%d %H:%M:%S.%f').strftime('%d/%m/%Y %H:%M')
		log.subject = TAG_RE.sub('', cstr(log.subject))

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

@frappe.whitelist(allow_guest=True)
def setSecondaryAddrForProvider(data):
	import json
	data = json.loads(data)
	res = data.get('res')
	provider_id = data.get('provider_id')
	
	from templates.pages.provider import create_addr
	create_addr(json.dumps(res), provider_id)

	return "Address attached to provider"

@frappe.whitelist(allow_guest=True)
def getSecondaryAddrForProvider(data):
	import json
	data = json.loads(data)

	from templates.pages.provider import get_address
	return get_address(data.get("provider_id"))

""" Event/Visit Sharing """
@frappe.whitelist(allow_guest=True)
def sharingViaProvider(data):
	from templates.pages.event import share_via_providers_account
	data = json.loads(data)
	if data.get("event_id") and data.get("visit_id"):
		data['entityid'] = data.get("visit_id")
	else:
		data['entityid'] = data.get("event_id")
		data.pop("event_id")

	res = share_via_providers_account(data)
	if res["returncode"] == 2:
		notify_provider(data)		
	return res

def notify_provider(data):
	from templates.pages.dashboard import get_user_details
	from templates.pages.event import notify_provider
	user = get_user_details(data.get("profile_id"))
	args = {"patient":user["name"],"duration":data.get('sharing_duration')}
	email_msg = "%(patient)s has shared Event with You which is accesible upto %(duration)s. \n\n Thank you.\n Team HealthSnapp."%args
	notify_provider(data.get('doctor_id'),data.get('profile_id'),"Event Share",args,email_msg)

@frappe.whitelist(allow_guest=True)
def sharingViaEmail(data):
	from templates.pages.event import share_via_email
	data=json.loads(data)
	res = write_docfile(data)
	# return data.get('files')
	return share_via_email(data)

def write_docfile(data):
	import os
	for indx, file_path in enumerate(data.get('files')):
		base_dir_path = os.path.join(os.getcwd(), get_site_path().replace('.',"").replace('/', ""), 'public', 'files')
		folder_lst = file_path.split('/')
		file_path =  '/'.join(folder_lst[:-1]) 
		doc_name = folder_lst[-1:][0]
		doc_base_path = os.path.join(base_dir_path, file_path)

		if '-watermark' not in doc_name:
			dname = doc_name.split('.')
			doc_name = dname[0]+'-watermark.'+dname[1]

		data.get('files')[indx] = "{doc_base_path}/{doc_name}".format(doc_base_path=doc_base_path, doc_name=doc_name)

		if not os.path.exists(doc_base_path + '/' +doc_name):
			frappe.create_folder(doc_base_path)
			data = {
				"entityid": folder_lst[4],
				"profile_id": folder_lst[0],
				"event_id": folder_lst[1],
				"tag_id": folder_lst[4] + '-' + cstr(folder_lst[2].split('-')[1]) + cstr(folder_lst[3].split('_')[1]),
				"file_id": [
					doc_name.replace('-watermark','')
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
	#data = json.loads(data)
	data = json.loads(frappe.local.request.data)

	if data.get('file_name'):
		file_path = "%(files_path)s/%(profile_id)s/%(file_name)s"%{'files_path': get_files_path(), "profile_id": data.get('profile_id'),
			'file_name': data.get('file_name')
		}
		path = os.path.join(os.getcwd(), get_files_path()[2:], data.get('profile_id'))
		frappe.create_folder(path)
		with open("%s/%s"%(path,data.get('file_name')), 'wb') as f:
	 		f.write(base64.b64decode(data.get('bin_img')))

 		res = update_image(data.get('profile_id'), data.get('file_name'))
 		return {"filestatus": res}
 	
def update_image(profile_id, file_name=None):
	from templates.pages.profile import update_user_image
	file_path = "/files/%s/%s"%(profile_id, file_name)
	res = update_user_image(file_path,profile_id)
	return "Image Uploaded successfully"
	
@frappe.whitelist(allow_guest=True)
def getProfileImage(data):
	import os
	from templates.pages.profile import get_user_image
	from frappe.utils import get_url

	data = json.loads(data)
	user_img = get_user_image(data.get('profile_id'))
	
	if user_img.get('image'):
		return {
			"profile_id": data.get('profile_id'),
			"file_name": user_img.get('image').split('/')[-1:][0],
			"img_url": "%s%s"%(get_url(), user_img.get('image'))
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
	header_row = ["<th></th>"]
	body_rows = []

	dm_details = frappe.db.sql(""" select label,fieldname,idx from `tabEvent Parameters` 
			where parent = "%s" order by idx """%(share_info["event_id"]), as_dict=1)

	for data in share_info["data"]:
		row = "<td></td>"
		for dm_info in dm_details:
			try:
				header_row[dm_info.get("idx")] = "<th>%s</th>"%dm_info.get("label")
			except IndexError:
				header_row.insert(dm_info.get("idx"), "<th>%s</th>"%dm_info.get("label"))

			row+="""<td>%s</td>"""%data[dm_info.get("fieldname")]
		body_rows.append(row)

	return {
		"header": "".join(header_row),
		"data_row": body_rows
	}

@frappe.whitelist(allow_guest=True)
def deactivateMedication(data):
	from templates.pages.medication import update_status
	data = json.loads(data)
	
	data['file_name'] = "medication"
	data['param'] = "listview"

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
	from templates.pages.profile import make_mv_entry, send_mobile_v_code
	data = json.loads(data)
	res = create_linkedphr(json.dumps(data))

	if res.get('returncode') == 122 and data.get('mobile'):
		mob_code = make_mv_entry(data.get('mobile'), res.get('entityid'))
		if mob_code:
			send_mobile_v_code(data.get('mobile'), data.get('entityid'), mob_code)


	return {
		"returncode": res.get('returncode'),
		"actualdata": json.loads(res.get('actualdata')),
		"entityid": res.get('entityid'),
		"message_summary": res.get('message_summary')
	}

@frappe.whitelist(allow_guest=True)
def forgotPassword(data):
	try:
		data = json.loads(data)
		# check the data type of user if type is not str then convert to string
		user = data.get("user") if isinstance(data.get("user"), str) else str(data.get("user"))

		if not user:
			msg="""Invalid Email ID, Email ID can not be None"""
			return {"returncode":401,"msg_display":msg}
		else:
			from templates.pages.login import reset_password
			return reset_password(user)
	except ValueError, e:
		msg="""Invalid Parameters, Please mention the user's email id .."""
		return {"returncode":401,"msg_display":msg}

@frappe.whitelist(allow_guest=True)
def create_chemist_order(data):
	"""
		1.Read data
		2.Read Binary file content and Write to public files
		3.Insert Order
		Input:
		{
			"chemist_id":"value"
			"stockist_id":"value"
			"expected_delivery_date":"value"
			"mode_of_payment":"value"	
			"order_description":"value"
			"image_data":"binary"
		}
	"""

	data = json.loads(data)
	print data.get("expected_delivery_date"),data.get("order_description")
	chemist_order = frappe.new_doc("Chemist Order")
	chemist_order.update ( {
		"chemist_id" : data.get("chemist_id"),
		"stockist_id" : data.get("stockist_id"),
		"expected_delivery_date" : data.get("expected_delivery_date"),
		"order_description" : data.get("order_description"),
		"mode_of_payment" : data.get("mode_of_payment"),
	})
	items_manual = data.get("items")
	for item in items_manual:
		chemist_order.append("chemist_order_manual",{
				"item" : item.get("item"),
				"quantity" : item.get("quantity"),
				"__islocal":1
			})

	chemist_order.insert(ignore_permissions=True)
	chemist_order_id=chemist_order.name
	# """ NonStop Code Start """
	# chemist_order_manual = chemist_order.get("chemist_order_manual")
	# items_manual = data.get("items")
	# for item in items_manual:
	# 	chemist_order_manual.append({
	# 			"item" : item.get("item"),
	# 			"quantity" : item.get("quantity"),
	# 			"parent":chemist_order_id,
	# 			"parenttype":"Chemist Order",
	# 			"docstatus":0
	# 		})
	# chemist_order.save(ignore_permissions=True)
	#chemist_order.update_if_missing = True
	""" NonStop Code End """


	import os
	from frappe.utils import  get_files_path

	file_path = "%(files_path)s/orders/%(chemist_order_id)s"%{'files_path':get_files_path(),"chemist_order_id":chemist_order_id}
	path = os.path.join(os.getcwd(), get_files_path()[2:], "orders")
	if not os.path.exists(os.path.join(get_files_path(),"orders")):
		path = os.path.join(os.getcwd(), get_files_path()[2:], "orders")
		frappe.create_folder(path)
	with open("%s/%s"%(path,chemist_order_id), 'wb') as f:
		f.write(base64.b64decode(data.get('image_data')))
	file_url= "files/orders/" + chemist_order_id + ""	 
	print file_url
	chemist_order.order_image_url=file_url
	chemist_order.save(ignore_permissions=True)

@frappe.whitelist(allow_guest=True)
def saveDiseaseMonitoringDataManual(data,arg):
	import time
	from templates.pages.disease_monitoring import save_data_to_solr
	str_data=[]
	for key,value in json.loads(data).items():
		datastr=key+'='+value
		str_data.append(datastr)
	args=json.loads(arg)
	args["data"]=str_data
	args["str_event_date"]=time.strftime('%d/%m/%Y')

	if args.has_key("date"):
		args["str_diseaseMonitoring_date"]=args['date']
	else:
		args["str_diseaseMonitoring_date"]=	time.strftime('%d/%m/%Y')
	
	res=save_data_to_solr(json.dumps(args))	
	return "Record Updated Successfully"
 
@frappe.whitelist(allow_guest=True)
def create_patient_prescription(data):
	"""
		1.Read data
		2.Read Binary file content and Write to public files
		3.Insert Prescription
		Input:
		{
			"appointment_id":"value"
			"patient_id":"value"
			"provider_id":"value"
			"image_data":"binary"
			"prescription_note":"value"
			"prescription_assignment_status":"value"
		}
	"""
	data = json.loads(data)
	patient_prescription = frappe.new_doc("Patient Prescriptions")
	patient_prescription.update ( {
		"patient_id" : data.get("patient_id"),
		"provider_id" : data.get("provider_id"),
		"prescription_note" : data.get("prescription_note"),
		"prescription_assignment_status" : data.get("prescription_assignment_status"),
	})
	patient_prescription.insert(ignore_permissions=True)
	patient_prescription_id=patient_prescription.name
	import os
	from frappe.utils import  get_files_path

	file_path = "%(files_path)s/p-prescriptions/%(patient_prescription_id)s"%{'files_path':get_files_path(),"patient_prescription_id":patient_prescription_id}
	path = os.path.join(os.getcwd(), get_files_path()[2:], "p-prescriptions")
	if not os.path.exists(os.path.join(get_files_path(),"p-prescriptions")):
		path = os.path.join(os.getcwd(), get_files_path()[2:], "p-prescriptions")
		frappe.create_folder(path)
	with open("%s/%s"%(path,patient_prescription_id), 'wb') as f:
		f.write(base64.b64decode(data.get('image_data')))
	file_url= "files/p-prescriptions/" + patient_prescription_id + ""	 
	print file_url
	patient_prescription.prescription_image_url=file_url
	patient_prescription.save(ignore_permissions=True)

	if not data.has_key("appointment_id"):
		appointment_id=data.get("appointment_id")
		appointments = frappe.get_doc("Appointments",appointment_id)
		appointments.status = "Completed"
		appointments.save(ignore_permissions=True)
	return patient_prescription_id

@frappe.whitelist(allow_guest=True)
def create_order_delivery_log(data):
	"""
		1.Read data
		2.Read Binary file content and Write to public files
		3.Insert Order Bill
		Input:
		{
			"order_delivery_mode":"value"
			"bill_number":"value"
			"image_data":"binary"
			"bill_amount":"value"
			"net_amount_due" : "value"
			"order_id":"value"
		}
	"""
	data = json.loads(data)
	order_id = data.get("order_id")
	order_log = frappe.new_doc("Chemist Order Delivery Log")
	order_log.update ( {
		"order_delivery_mode" : data.get("order_delivery_mode"),
		"bill_number" : data.get("bill_number"),
		"bill_amount" : data.get("bill_amount"),
		"order_id" : data.get("order_id"),
		"net_amount_due" : data.get("net_amount_due"),
		
	})
	order_log.insert(ignore_permissions=True)
	order_log_id=order_log.name
	image_data=data.get("image_data")
	if not image_data:
		import os
		from frappe.utils import  get_files_path

		file_path = "%(files_path)s/orderslog/%(order_log_id)s"%{'files_path':get_files_path(),"order_log_id":order_log_id}
		path = os.path.join(os.getcwd(), get_files_path()[2:], "orderslog")
		if not os.path.exists(os.path.join(get_files_path(),"orderslog")):
			path = os.path.join(os.getcwd(), get_files_path()[2:], "orderslog")
			frappe.create_folder(path)
		with open("%s/%s"%(path,order_log_id), 'wb') as f:
			f.write(base64.b64decode(data.get('image_data')))
		file_url= "files/orderslog/" + order_log_id + ""	 
		print file_url
		order_log.stockist_bill_image=file_url
		order_log.save(ignore_permissions=True)

	chemist_order = frappe.get_doc("Chemist Order", order_id)
	chemist_order.order_status="Waiting"
	chemist_order.save(ignore_permissions=True)

@frappe.whitelist(allow_guest=True)
def assign_prescription_to_chemist(data):
	"""
		1.Read data
		2.Insert prescription Assignment Log
		3. Update Ptient prescription
		Input:
		{
			"prescription_id":"value"
			"parent":"value"
			"prescription_assigned_to_chemist":"value"
			"chemist_accepted_flag":"value"
			"delivery_status":"value"
		}
	"""
	data = json.loads(data)
	prescription_log = frappe.new_doc("Prescription Assignment Log")
	prescription_log.update ( {
		"prescription_id" : data.get("prescription_id"),
		"parent" : data.get("prescription_id"),
		"prescription_assigned_to_chemist" : data.get("prescription_assigned_to_chemist"),
		"chemist_accepted_flag" : data.get("chemist_accepted_flag"),
		"delivery_status" : data.get("delivery_status"),
	})
	prescription_log.insert(ignore_permissions=True)
	prescription_log_id=prescription_log.name
	patient_prescription= frappe.get_doc("Patient Prescriptions", data.get("prescription_id"))
	patient_prescription.prescription_assignment_status="Assigned"
	patient_prescription.save(ignore_permissions=True)

@frappe.whitelist(allow_guest=True)
def update_prescription_delivery_log(data):
	"""
		1.Read data
		2.Read Binary file content and Write to public files
		3.Update Prescription Assignment Log
		Input:
		{
			"prescription_log_id":"value"
			"prescription_id":"value"
			"image_data":"binary"
		}
	"""
	data = json.loads(data)
	prescription_log_id = data.get("prescription_log_id")
	delivery_team_member_id = data.get("delivery_team_member_id")
	print prescription_log_id
	import os
	from frappe.utils import  get_files_path

	file_path = "%(files_path)s/uploadBillLog/%(prescription_log_id)s"%{'files_path':get_files_path(),"prescription_log_id":prescription_log_id}
	path = os.path.join(os.getcwd(), get_files_path()[2:], "uploadBillLog")
	if not os.path.exists(os.path.join(get_files_path(),"uploadBillLog")):
		path = os.path.join(os.getcwd(), get_files_path()[2:], "uploadBillLog")
		frappe.create_folder(path)
	with open("%s/%s"%(path,prescription_log_id), 'wb') as f:
		f.write(base64.b64decode(data.get('image_data')))
	file_url= "files/uploadBillLog/" + prescription_log_id + ""	 
	print data.get("prescription_id")	
	# prescription = get_doc("Patient Prescriptions",data.get("prescription_id"))
	# prescription.prescription_assignment_status = "Waiting For Patients Confirmation"
	# prescription.save(ignore_permissions=True)
	frappe.db.sql(""" update `tabPrescription Assignment Log` 
		set bill_image_url = '%s',delivery_status='Waiting For Patients Confirmation',
		delivery_team_member_id = '%s'	
		where name ='%s'"""%(file_url,delivery_team_member_id,prescription_log_id))
	frappe.db.commit()


@frappe.whitelist(allow_guest=True)
def get_login_details(data):
	"""
		1.Read data
		2.Accoring To Role Returns ID of DocType
		Input:
		{
			"profile_id":"value"
			"role":"value"
		}
	"""
	data = json.loads(data)
	role=data.get("role")
	profile_id=data.get("profile_id")
	if role=="Chemist":
		return frappe.db.sql(""" select name from tabChemist 
			where profile_id='%s' """%(profile_id), as_dict=1)
	elif role=="Stockist":
		return frappe.db.sql(""" select name from tabStockist 
			where stockist_id='%s' """%(profile_id), as_dict=1)
	elif role=="Provider":
		return frappe.db.sql(""" select name from tabProvider 
			where provider_id='%s' """%(profile_id), as_dict=1)

@frappe.whitelist(allow_guest=True)
def get_chemist_order_bill(data):
	"""
		1.Read data
		2.finds last uploaded bill
		Input:
		{
			"order_id":"value"
		}
	"""
	data = json.loads(data)
	order_id=data.get("order_id")
	pass
	return frappe.db.sql(""" select stockist_bill_image from `tabChemist Order Delivery Log`
		where order_id='%s' and bill_number<>''  order by name desc limit 0,1
		"""%(order_id), as_dict=1)


@frappe.whitelist(allow_guest=True)
def send_emergency_message(data):
	"""
		1.Accepts List Mobile Numbers and Message Bosy 
		2.Sends Direct SMS
		Input:
		{
			"mobile_number":"value",
			"body":"value",
		}
	"""
	data = json.loads(data)
	mobile_number = data.get("mobile_number")
	body = data.get("body")
	from erpnext.setup.doctype.sms_settings.sms_settings import send_sms
	send_sms(mobile_number,body)
	return "Sms Send Success"

@frappe.whitelist(allow_guest=True)
def getDiseaseMonitoringDiseaseList():
	return frappe.db.sql(""" select name,disease_name from `tabDisease Monitoring` """,as_dict=1)

@frappe.whitelist(allow_guest=True)
def getDiseaseMonitoringDiseaseFieldList(data):
	"""
		1.Accepts List Mobile Numbers and Message Bosy 
		2.Sends Direct SMS
		Input:
		{
			"disease_id":"value",
		}
	"""
	data = json.loads(data)
	disease_id=data.get("disease_id")
	return frappe.db.sql(""" select fieldname,fieldtype,label from `tabDisease Monitoring` as dm,`tabEvent Parameters` as tp where tp.parent=dm.name and dm.name='%s' """%(disease_id),as_dict=1)

@frappe.whitelist(allow_guest=True)
def getNotDeliveredMyPrescriptionList(data):
	"""
		1.Accepts Patient ID
		2.Sends All Prescriotion List Which is not completely deliverd
		Input:
		{
			"patient_id":"value",
		}
	"""
	data = json.loads(data)
	patient_id=data.get("patient_id")
	return frappe.db.sql(""" select presc.name as prescription_id,user.contact as mobile_number,user.first_name,user.last_name,presc.prescription_image_url from `tabPatient Prescriptions` presc INNER JOIN tabUser user on presc.provider_id=user.profile_id where patient_id='%s' and prescription_assignment_status!='Completed' and provider_id<>'' """%(patient_id) , as_dict=1)


@frappe.whitelist(allow_guest=True)
def create_order_to_chemist_from_patient(data):
	"""
		1.Read data
		2.Read Binary file content and Write to public files
		3.Insert Prescription
		Input:
		{
			"prescription_assigned_to_chemist":"value"				
			"appointment_id":"value"
			"patient_id":"value"
			"provider_id":"value"
			"image_data":"binary"
			"prescription_note":"value"
			"prescription_assignment_status":"value"
			"prescription_flag="value"
		}
	"""
	data = json.loads(data)
	
	chemist=frappe.get_doc("Chemist",data.get("prescription_assigned_to_chemist"))
	print chemist.profile_id
	dataChemist={
			"prescription_assigned_to_chemist":	chemist.profile_id,			
			"appointment_id":data.get("appointment_id"),
			"patient_id":data.get("patient_id"),
			"provider_id":data.get("provider_id"),
			"image_data":data.get("image_data"),
			"prescription_note":data.get("prescription_note"),
			"prescription_assignment_status":data.get("prescription_assignment_status"),
		}
	patient_prescription_id = create_patient_prescription(json.dumps(dataChemist))
	
	logdata={
			"prescription_id":patient_prescription_id,
			"parent":patient_prescription_id,
			"prescription_assigned_to_chemist":chemist.profile_id,
			"chemist_accepted_flag":"0",
			"delivery_status":"Assigned"
		}
	assign_prescription_to_chemist(json.dumps(logdata))
	return patient_prescription_id
	
 


# @frappe.whitelist(allow_guest=True)
# def createChemist(data):
# 	from phr.phr.doctype.chemist.chemist import create_chemist
# 	data = json.loads(data)
# 	res = 
# 	del res['actualdata']
# 	return res

# """AES test method"""

# BLOCK_SIZE = 64
# PADDING = '\f'

# pad = lambda s: s + (BLOCK_SIZE - len(s) % BLOCK_SIZE) * PADDING

# EncodeAES = lambda c, s: base64.b64encode(c.encrypt(pad(s)))
# DecodeAES = lambda c, e: c.decrypt(base64.b64decode(e)).rstrip(PADDING)

# def get_key():
# 	return '0123456789abcdef'

# @frappe.whitelist(allow_guest=True)
# def get_decoded_result(data):
# 	from Crypto.Cipher import AES
# 	import os
# 	import  json

# 	cipher = AES.new('0123456789abcdef')

# 	data =json.loads(data)
# 	decoded = DecodeAES(cipher,data.get('encoded'))
# 	decoded = json.loads(decoded)
# 	decoded['success-code'] = "test code 102"

# 	encoded = EncodeAES(cipher, str(decoded))

# 	return encoded

