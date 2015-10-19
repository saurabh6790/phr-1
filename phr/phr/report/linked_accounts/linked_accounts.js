// Copyright (c) 2013, indictrans and contributors
// For license information, please see license.txt

frappe.query_reports["Linked Accounts"] = {
	"filters": [
		{
			"fieldname":"user_name",
			"label": __("User Name"),
			"fieldtype": "Link",
			"options": "User",
			"width": "80",
			"get_query": function() {
				return {
					"query": "phr.templates.pages.profile.get_patients"
				}
			}
		}
	]
}
