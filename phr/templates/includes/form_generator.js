frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}

var RenderFormFields = function(){
	this.wrapper = ""
}

$.extend(RenderFormFields.prototype,{
	init:function(wrapper, arg){
		this.wrapper = wrapper;
		this.args = arg;
		this.get_field_meta();
	} ,
	get_field_meta:function(){
		var me = this;
		frappe.call({
			method:'phr.templates.pages.patient.get_data_to_render',
			args:{'data': me.args},
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
		!this.column && this.column_break_field_renderer();
		$(repl_str('<div class="input-group">\
						%(label)s: <input type="text" class="input-with-feedback form-control" placeholder="%(label)s"\
						aria-describedby="basic-addon2">\
					</div>', field_meta)).appendTo($(this.column))
	},
	select_field_renderer: function(field_meta){

	},
	section_field_renderer: function(field_meta){

	},
	table_field_renderer: function(field_meta){

	},
	column_break_field_renderer: function(field_meta){

		this.column = $('<div class="form-column">\
			<form>\
			</form>\
		</div>').appendTo($(this.wrapper))
			.find("form")
			.on("submit", function() { return false; })

		// distribute all columns equally
		var colspan = cint(12 / $(this.wrapper).find(".form-column").length);
		$(this.wrapper).find(".form-column").removeClass()
			.addClass("form-column")
			.addClass("col-md-" + colspan);
	}
})
