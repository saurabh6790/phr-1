// Copyright (c) 2013, indictrans and contributors
// For license information, please see license.txt

frappe.query_reports["Appointments"] = {
	"filters": [
		{
			"fieldname":"from_date",
			"label": __("From Date"),
			"fieldtype": "Datetime",
			"width": "80",
			"default": sys_defaults.year_start_date,
		},
		{
			"fieldname":"to_date",
			"label": __("To Date"),
			"fieldtype": "Datetime",
			"width": "80",
			"default": frappe.datetime.get_today()
		}
	]
}
