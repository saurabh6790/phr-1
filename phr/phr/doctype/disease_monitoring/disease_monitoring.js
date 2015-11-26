cur_frm.cscript.onload = function(doc, dt, dn){
	if(doc.__islocal){
		add_date_field(doc, dt, dn)
	}
}

add_date_field = function(doc, dt, dn){
	chld = frappe.model.add_child(doc, 'Event Parameters', 'parameters');
		
	chld.label =  "Date"
	chld.fieldtype = "datetime"
	chld.fieldname = "date"
	chld.required = 1

	refresh_field('parameters')
}