// Copyright (c) 2013, indictrans and contributors
// For license information, please see license.txt

frappe.query_reports["Disease Monitoring"] = {
	"filters": [
		{
			"fieldname":"disease",
			"label": __("Disease"),
			"fieldtype": "Link",
			"options": "Disease Monitoring",
			"width": "120",
			"get_query": function() {
				return {
					"query": "phr.phr.doctype.disease_monitoring.disease_monitoring.get_diseases"
				}
			}
		}

	]
}
