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
web_include_js = ["/assets/phr/confirm-bootstrap.js","/assets/phr/pdfjs/build/pdf.js", "/assets/phr/pdfjs/web/viewer.js", "assets/js/frappe-web.min.js", "website_script.js","assets/phr/jasny-bootstrap/js/jasny-bootstrap.js","assets/phr/jasny-bootstrap/js/jasny-bootstrap.min.js"]

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

# scheduler_events = {
# 	"all": [
# 		"phr.tasks.all"
# 	],
# 	"daily": [
# 		"phr.tasks.daily"
# 	],
# 	"hourly": [
# 		"phr.tasks.hourly"
# 	],
# 	"weekly": [
# 		"phr.tasks.weekly"
# 	]
# 	"monthly": [
# 		"phr.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "phr.install.before_tests"

# Overriding Whitelisted Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.core.doctype.event.event.get_events": "phr.event.get_events"
# }

