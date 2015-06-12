import os
import frappe
import tarfile
import random
from frappe import conf
from datetime import datetime
verbose = 0

backup_conf = {
	"DMS":{
		"source_dir" : "/home/saurabh/Documents/DMS/DMS_SERVER_03122014",
		"filename" : "dms"
	},
	"SOLR":{
		"source_dir" : "/home/saurabh/Documents/SOLR/solr-4.8.0",
		"filename" : "solr"
	}
}

def get_backup_path():
	"""
		Provides backup path location
	"""
	backup_path = frappe.utils.get_site_path(conf.get("backup_path", "private/backups"))
	return backup_path

def get_token_name(filename):
	"""
		Generate filename with specified file name, today's date and 8 digit random number
	"""
	todays_date = "".join(str(datetime.date(datetime.today())).split("-"))
	random_number = str(int(random.random()*99999999))

	return todays_date + "_" + random_number + "_" + filename + ".tar.gz"

def take_backup():
	"""
		take backp of solr and dms after every 6 hrs
	"""
	for backup_util in backup_conf.values():
		filename = os.path.join(get_backup_path(), get_token_name(backup_util['filename']))

		with tarfile.open(filename, "w:gz") as tar:
			tar.add(backup_util['source_dir'], arcname=os.path.basename(backup_util['source_dir']))
	delete_temp_backups()

def delete_temp_backups(older_than=24):
	"""
		Cleans up the backup_link_path directory by deleting files older than 24 hours
	"""
	file_list = os.listdir(get_backup_path())
	for this_file in file_list:
		this_file_path = os.path.join(get_backup_path(), this_file)
		if is_file_old(this_file_path, older_than):
			os.remove(this_file_path)

def is_file_old(db_file_name, older_than=24):
		"""
			Checks if file exists and is older than specified hours
			Returns ->
			True: file does not exist or file is old
			False: file is new
		"""
		if os.path.isfile(db_file_name):
			from datetime import timedelta
			#Get timestamp of the file
			file_datetime = datetime.fromtimestamp\
						(os.stat(db_file_name).st_ctime)
			if datetime.today() - file_datetime >= timedelta(hours = older_than):
				if verbose: print "File is old"
				return True
			else:
				if verbose: print "File is recent"
				return False
		else:
			if verbose: print "File does not exist"
			return True