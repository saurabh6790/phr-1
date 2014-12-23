frappe.RenderFormFields = Class.extend({
	init:function(){
		console.log("form render")
		this.get_field_meta()
	},
	get_field_meta:function(){
		var me = this;
		frappe.call({
			method:'phr.templates.pages.patient.get_data_to_render',
			callback: function(r){
				me.render_fields(fr.message[0], r.message[1])
			}
		})
	},
	render_fields:function(fields, values){
		$content = $(this.document).find("#main-con")
		h="";
		for (i=0;i<fields.length;i++){
			console.log(fields[i]["fieldtype"])
			if (fields[i]["fieldtype"]=="data"){
				 h+='<input type="text" value="'+values[fields[i]["fieldname"]]+'"">'
			}	
		}
		$($content).append(h)
	}
})