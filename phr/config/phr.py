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
					"name": "Advertisements",
					"description": _("Share Fiiles Log"),
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

		
	]
