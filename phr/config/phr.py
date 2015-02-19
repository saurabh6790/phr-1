from frappe import _

def get_data():
	return [
		{
			"label": _("Documents"),
			"icon": "icon-star",
			"items": [
				{
					"type": "doctype",
					"name": "Appointments",
					"description": _("User Appointments"),
				},
				{
					"type": "doctype",
					"name": "Medication",
					"description": _("User Daily Medications"),
				},
				{
					"type": "doctype",
					"name": "Notification Configuration",
					"description": _("User Notifications"),
				},
				{
					"type": "doctype",
					"name": "Providers Linked",
					"description": _("Providers Linked with Profile"),
				},
				{
					"type": "doctype",
					"name": "Shortcut",
					"description": _("Manage User Dashboard"),
				},
				{
					"type": "doctype",
					"name": "Verification Details",
					"description": _("Verification details For User"),
				},
				{
					"type": "doctype",
					"name": "Shared Requests",
					"description": _("Shared Requests"),
				},
				{
					"type": "doctype",
					"name": "Share Files Log",
					"description": _("Share Fiiles Log"),
				},
				{
					"type": "doctype",
					"name": "Disease Sharing Log",
					"description": _("Disease Monitoring Sharing Log"),
				},
				{
					"type": "doctype",
					"name": "Advertisements",
					"description": _("Advertisements"),
				},
			]
		},
		{
			"label": _("Masters"),
			"icon": "icon-medkit",
			"items": [
				{
					"type": "doctype",
					"name": "Provider",
					"description": _("Provider Master")
				},
				{
					"type": "doctype",
					"name": "Disease Monitoring",
					"description": _("Disease Monitoring Master"),
				},
				{
					"type": "doctype",
					"name": "Events",
					"description": _("Event Master"),
				},
				{
					"type": "doctype",
					"name": "Dosage",
					"description": _("Dosage"),
				},
				{
					"type": "doctype",
					"name": "State",
					"description": _("States In India"),
				},
			]
		},
		{
			"label": _("Setup"),
			"icon": "icon-cog",
			"items": [
				{
					"type": "doctype",
					"name": "Provider Category",
					"description": _("Provider Categories")
				},
				{
					"type": "doctype",
					"name": "Provider Type",
					"description": _("Provider Types"),
				},
			]
		},
		{
			"label": _("Reports"),
			"icon": "icon-table",
			"items": [
				{
					"type": "report",
					"is_query_report": True,
					"name": "Patient Login Details",
					"doctype": "User"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Patient Registration Logs",
					"doctype": "Verification Details"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Medications",
					"doctype": "Medication"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Appointments",
					"doctype": "Appointments"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Disabled Accounts",
					"doctype": "User"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Events",
					"doctype": "Events"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Visits",
					"doctype": "Events"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Disease Monitoring",
					"doctype": "Disease Monitoring"
				},
				{
					"type": "report",
					"is_query_report": True,
					"name": "Linked Accounts",
					"doctype": "Providers Linked"
				},
			]
		},
	]
