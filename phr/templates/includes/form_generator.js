frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}

var RenderFormFields = function(){
	this.wrapper = ""
}

$.extend(RenderFormFields.prototype,{
	init:function(wrapper){
		this.wrapper = wrapper;
		this.get_field_meta();
	} ,
	get_field_meta:function(){
		var me = this;
		frappe.call({
			method:'phr.templates.pages.patient.get_data_to_render',
			callback: function(r){
				me.render_fields(r.message[0], r.message[1])
			}
		})
	},
	render_fields:function(fields, values){
		var me = this;
		$.each(fields,function(indx, meta){
			me[meta['fieldtype'] + "_field_renderer"].call(me, meta)
		})
	},
	data_field_renderer: function(field_meta){
		$(repl_str('<div class="input-group">\
						%(label)s: <input type="text" class="form-control" placeholder="%(label)s"\
						aria-describedby="basic-addon2">\
					</div>', field_meta)).appendTo($(this.wrapper))
	},
	select_field_renderer: function(field_meta){

	},
	section_field_renderer: function(field_meta){

	},
	table_field_renderer: function(field_meta){

	}
})
