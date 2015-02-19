// Copyright (c) 2013, indictrans and contributors
// For license information, please see license.txt

frappe.query_reports["Patient Login Details"] = {
	"filters": [
		{
			"fieldname":"user_name",
			"label": __("User Name"),
			"fieldtype": "Link",
			"options": "User",
			"width": "80",
		}
	]
}
