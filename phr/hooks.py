app_name = "phr"
app_title = "phr"
app_publisher = "indictrans"
app_description = "phr"
app_icon = "icon-plus-sign-alt"
app_color = "red"
app_email = "a@b.com"
app_url = "google.com"
app_version = "0.0.1"

base_template="templates/phr_base.html"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
#app_include_css = "templates/includes/dashboard.css"
# app_include_js = "/assets/phr/js/phr.js"
#app_include_js = "assets/js/frappe.min.js"

# include js, css files in header of web template

#

web_include_js = [	"assets/js/frappe-web.min.js",  
					"assets/phr/bootstrap-table.js","assets/phr/js/nprogress.js","assets/frappe/js/frappe/misc/datetime.js","assets/js/phr-web.min.js"
				]

fixtures=["Disease Monitoring","Dosage", "State", "Events", "Specialization", "Provider Type", "Provider Category","Message Templates"]

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------
website_generators = ["PHR Forms"]

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "phr.install.before_install"
# after_install = "phr.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "phr.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.core.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.core.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

scheduler_events = {
	"all": [
		"phr.templates.pages.appointments.notify_appointments","phr.templates.pages.todo.notify_to_do","phr.templates.pages.medication.notify_medications"
	],
	"daily": [
		"phr.templates.pages.profile.notify_about_registration","phr.templates.pages.medication.update_status_of_medication",
	]
}

# Testing
# -------

# before_tests = "phr.install.before_tests"

# Overriding Whitelisted Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.core.doctype.event.event.get_events": "phr.event.get_events"
# }

