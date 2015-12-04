cur_frm.cscript.onload = function(doc, cdt, cdn){
	initiate_slot_table(doc, cdt, cdn)
}

cur_frm.cscript.provider = function(doc, cdt, cdn){
	initiate_slot_table(doc, cdt, cdn)	
}

cur_frm.fields_dict.slot_info.grid.get_field("location").get_query = function(doc) {
	return {
		filters: {
			"provider": doc.provider
		}
	}
}


cur_frm.add_fetch("location", "from_time", "from_time")
cur_frm.add_fetch("location", "to_time", "to_time")


initiate_slot_table = function(doc, cdt, cdn){
	date_diff = frappe.datetime.get_diff(frappe.datetime.month_end(), frappe.datetime.month_start());

	doc.slot_info = [];

	for (var i=0; i<=1; i++) {
		var row = frappe.model.add_child(doc, "Slot Details", "slot_info");
		row.date = frappe.datetime.add_days(frappe.datetime.month_start(), i) 
	}
}