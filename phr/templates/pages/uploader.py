# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

from __future__ import unicode_literals
import frappe
import os, base64, re
import hashlib
import mimetypes
from frappe.utils import get_site_path, get_hook_method, get_files_path, get_site_base_path, get_path, get_site_name
from frappe import _
from frappe import conf
from copy import copy

class MaxFileSizeReachedError(frappe.ValidationError): pass

def get_file_url(file_data_name):
	data = frappe.db.get_value("File Data", file_data_name, ["file_name", "file_url"], as_dict=True)
	return data.file_url or data.file_name

@frappe.whitelist(allow_guest=True)
def upload():
	file_url = frappe.form_dict.file_url
	filename = frappe.form_dict.filename

	if not filename and not file_url:
		frappe.msgprint(_("Please select a file or url"),
			raise_exception=True)

	# save
	if filename:
		filedata = save_uploaded()

	return {
		"site_path" : os.path.join(os.getcwd(), get_site_path().replace('.',"").replace('/', ""), 'public', 'files'),
		"file_name": filedata['fname'],
		"success_meg": filedata['msg']
	}

def save_uploaded():
	fname, content = get_uploaded_content()
	if content:
		return save_file(fname, content);
	else:
		raise Exception

def save_url(file_url, dt, dn):

	f = frappe.get_doc({
		"doctype": "File Data",
		"file_url": file_url,
		"attached_to_doctype": dt,
		"attached_to_name": dn
	})
	f.ignore_permissions = True
	try:
		f.insert();
	except frappe.DuplicateEntryError:
		return frappe.get_doc("File Data", f.duplicate_entry)
	return f

def get_uploaded_content():
	# should not be unicode when reading a file, hence using frappe.form
	if 'filedata' in frappe.form_dict:
		if "," in frappe.form_dict.filedata:
			frappe.form_dict.filedata = frappe.form_dict.filedata.rsplit(",", 1)[1]
		frappe.uploaded_content = base64.b64decode(frappe.form_dict.filedata)
		frappe.uploaded_filename = frappe.form_dict.filename
		return frappe.uploaded_filename, frappe.uploaded_content
	else:
		frappe.msgprint(_('No file attached'))
		return None, None

def extract_images_from_html(doc, fieldname):
	content = doc.get(fieldname)
	frappe.flags.has_dataurl = False

	def _save_file(match):
		data = match.group(1)
		headers, content = data.split(",")
		filename = headers.split("filename=")[-1]
		# TODO fix this
		file_url = save_file(filename, content, doc.doctype, doc.name, decode=True).get("file_url")
		if not frappe.flags.has_dataurl:
			frappe.flags.has_dataurl = True

		return '<img src="{file_url}"'.format(file_url=file_url)

	if content:
		content = re.sub('<img\s*src=\s*["\'](data:[^"\']*)["\']', _save_file, content)
		if frappe.flags.has_dataurl:
			doc.set(fieldname, content)

def save_file(fname, content, decode=False):
	if decode:
		if isinstance(content, unicode):
			content = content.encode("utf-8")

		if "," in content:
			content = content.split(",")[1]
		content = base64.b64decode(content)

	file_size = check_max_file_size(content)
	if file_size.get('exe'):
		return {"msg": file_size.get('exe'), "fname": fname}

	content_hash = get_content_hash(content)
	content_type = mimetypes.guess_type(fname)[0]
	fname = get_file_name(fname, content_hash[-6:])
	method = get_hook_method('write_file', fallback=save_file_on_filesystem)
	file_data = method(fname, content, content_type=content_type)
	file_data = copy(file_data)
	return {"msg":"File Uploaded Successfully", "fname": fname}

def get_file_data_from_hash(content_hash):
	for name in frappe.db.sql_list("select name from `tabFile Data` where content_hash=%s", content_hash):
		b = frappe.get_doc('File Data', name)
		return {k:b.get(k) for k in frappe.get_hooks()['write_file_keys']}
	return False

def save_file_on_filesystem(fname, content, content_type=None):
	profile_id = frappe.form_dict.profile_id
	folder = frappe.form_dict.folder
	sub_folder = frappe.form_dict.sub_folder
	event_id = frappe.form_dict.event_id

	public_path = os.path.join(frappe.local.site_path, "public")
	if event_id and folder and sub_folder:
		folder_path = os.path.join(get_files_path(), profile_id, event_id, folder, sub_folder)

	elif profile_id:
		folder_path = os.path.join(get_files_path(), profile_id)

	fpath = write_file(content, folder_path, fname)
	path =  os.path.relpath(fpath, public_path)
	return {
		'file_name': os.path.basename(path),
		'file_url': '/' + path
	}

def check_max_file_size(content):
	max_file_size = conf.get('max_file_size') or 20971520
	file_size = len(content)

	if file_size > max_file_size:
		return {'exe': "File size exceeded the maximum allowed size of {0} MB".format(
			max_file_size / 1048576)}

	return {"file_size":file_size}

def write_file(content, file_path, fname):
	"""write file to disk with a random name (to compare)"""
	# create directory (if not exists)
	frappe.create_folder(file_path)

	# write the file
	with open(os.path.join(file_path.encode('utf-8'), fname.encode('utf-8')), 'w+') as f:
		f.write(content)
	return get_files_path(fname)

def remove_all(dt, dn):
	"""remove all files in a transaction"""
	try:
		for fid in frappe.db.sql_list("""select name from `tabFile Data` where
			attached_to_doctype=%s and attached_to_name=%s""", (dt, dn)):
			remove_file(fid, dt, dn)
	except Exception, e:
		if e.args[0]!=1054: raise # (temp till for patched)

def remove_file_by_url(file_url, doctype=None, name=None):
	if doctype and name:
		fid = frappe.db.get_value("File Data", {"file_url": file_url,
			"attached_to_doctype": doctype, "attached_to_name": name})
	else:
		fid = frappe.db.get_value("File Data", {"file_url": file_url})

	if fid:
		return remove_file(fid)

def remove_file(fid, attached_to_doctype=None, attached_to_name=None):
	"""Remove file and File Data entry"""
	file_name = None
	if not (attached_to_doctype and attached_to_name):
		attached = frappe.db.get_value("File Data", fid,
			["attached_to_doctype", "attached_to_name", "file_name"])
		if attached:
			attached_to_doctype, attached_to_name, file_name = attached

	ignore_permissions, comment = False, None
	if attached_to_doctype and attached_to_name:
		doc = frappe.get_doc(attached_to_doctype, attached_to_name)
		ignore_permissions = doc.has_permission("write") or False
		if not file_name:
			file_name = frappe.db.get_value("File Data", fid, "file_name")
		comment = doc.add_comment("Attachment Removed", _("Removed {0}").format(file_name))

	frappe.delete_doc("File Data", fid, ignore_permissions=ignore_permissions)

	return comment

def delete_file_data_content(doc):
	method = get_hook_method('delete_file_data_content', fallback=delete_file_from_filesystem)
	method(doc)

def delete_file_from_filesystem(doc):
	path = doc.file_name
	if path.startswith("files/"):
		path = frappe.utils.get_site_path("public", doc.file_name)
	else:
		path = frappe.utils.get_site_path("public", "files", doc.file_name)
	if os.path.exists(path):
		os.remove(path)

def get_file(fname):
	f = frappe.db.sql("""select file_name from `tabFile Data`
		where name=%s or file_name=%s""", (fname, fname))
	if f:
		file_name = f[0][0]
	else:
		file_name = fname

	file_path = file_name

	if not "/" in file_path:
		file_path = "files/" + file_path

	# read the file
	with open(get_site_path("public", file_path), 'r') as f:
		content = f.read()

	return [file_name, content]

def get_content_hash(content):
	return hashlib.md5(content).hexdigest()

def get_file_name(fname, optional_suffix):
	import time
	f = fname.rsplit('.', 1)
	extn = "." + f[1]
	return 'HLSNP-{filename}{extn}'.format(filename=str(int(round(time.time() * 1000))), extn=extn)

@frappe.whitelist()
def get_pdf_site_path(profile_id, folder, sub_folder, event_id, timestamp):
	site_path = os.path.join(os.getcwd(), get_site_path().replace('.',"").replace('/', ""), 'public', 'files')
	path = os.path.join(site_path, profile_id, event_id, folder, sub_folder)
	frappe.create_folder(path)
	return {
		'site_path': site_path,
		'timestamp': timestamp,
		'path':path 
	}

@frappe.whitelist()
def convert_text_to_pdf(profile_id, folder, sub_folder, event_id, timestamp,event_data):
	file_info =  get_pdf_site_path(profile_id, folder, sub_folder, event_id, timestamp)
	html = build_html(profile_id,event_data)
	file_path = write_html_to_pdf(file_info,html)

	return file_path

@frappe.whitelist()
def write_html_to_pdf(file_info,html):
	import time
	import pdfkit, os, frappe
	from frappe.utils import scrub_urls

	fname = 'HLSNP-{filename}.pdf'.format(filename=str(int(round(time.time() * 1000))))
	fpath = os.path.join(file_info.get('path'),fname)
	
	options = {}
	options.update({
		"print-media-type": None,
		"background": None,
		"images": None,
		'margin-top': '15mm',
		'margin-right': '15mm',
		'margin-bottom': '15mm',
		'margin-left': '15mm',
		'encoding': "UTF-8",
		'no-outline': None
	})
	html = scrub_urls(html)
	pdfkit.from_string(html, fpath, options=options or {})

	return {
		"path":fpath,
		"fname":fname
	}

@frappe.whitelist()
def build_html(profile_id,event_data):
	import json

	data = json.loads(event_data)
	data['print_data'] = '<br>'.join(data.get('print_data').split('\n')) 
	
	html = """<!DOCTYPE html>
	 		<!--[if IE 8]><html class="ie8" lang="en"><![endif]-->
			<!--[if IE 9]><html class="ie9" lang="en"><![endif]-->
			<!--[if !IE]><!-->
			<html lang="en">
			<!--<![endif]--> 
			<!-- start: HEAD -->
			<head>
				<title>Healthsnapp</title>  
				<link rel="stylesheet" href="assets/phr/css/styles.css">
			    <link rel="stylesheet" href="assets/phr/vendor/bootstrap/css/bootstrap.min.css"> 
			</head>
			<!-- end: HEAD -->
			<!-- start: BODY -->
			<body id="pdf-bg">
				<!-- start: CARD -->
				<div class="row">
					<div class="pdf-container">  
						<div class="pdf-header">
			              <div class="pdf-creation pull-left">
			              	<p>Date: <span>%(event_date)s</span></p>
			              	<p>Event Title: <span>%(event_title)s</span></p>
			                <p>Provider Name: <span>%(provider)s</span></p>
			                <p>Created By: <span>%(owner)s</span></p>        
			                <p>Powered By: <span>HealthSnapp</span></p>  
			              </div>
			              <div class="pdf-logo pull-right"><img src="assets/phr/images/card-logo.png"></div>
			              <div class="clearfix"></div>
			            </div>
			            <div>
			            	<div class="pdf-content">
			                	<p>%(print_data)s</p>
			              	</div>
			            </div>
			            <div class="clearfix"></div>
					</div>
				</div>
				<!-- end: CARD --> 
			</body>
			<!-- end: BODY -->
			</html>"""%data

	return html