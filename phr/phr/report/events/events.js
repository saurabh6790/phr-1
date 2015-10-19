// Copyright (c) 2013, indictrans and contributors
// For license information, please see license.txt

frappe.query_reports["Events"] = {
	"filters": [
		{
			"fieldname":"profile_id",
			"label": __("Profile Id"),
			"fieldtype": "Link",
			"width": "80",
			"options":"User",
			"get_query": function() {
				return {
					"query": "phr.templates.pages.profile.get_patients_ids"
				}
			}
		}
	]
}
