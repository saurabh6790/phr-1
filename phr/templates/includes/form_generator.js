frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
frappe.require("assets/frappe/js/lib/jquery/jquery.ui.min.js");
frappe.require("assets/frappe/js/lib/jquery/bootstrap_theme/jquery-ui.selected.css");

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
				me.render_fields(r.message[0], r.message[1],r.message[2])
			}
		})
	},
	render_fields:function(fields, values,tab){
		var me = this;
		
		if(tab==1) me.table_field_renderer()
		else !this.column && this.column_break_field_renderer()

		$.each(fields,function(indx, meta){
			meta['value']=values[meta['fieldname']] || ""
			me[meta['fieldtype'] + "_field_renderer"].call(me, meta)
		})
		var res = {};
		console.log([$("#form input, #form select, #form textarea"),"heehhek"])
	},
	data_field_renderer: function(field_meta){
		$(repl_str('<div class="input-group">\
			<div class="col-md-4">%(label)s:</div><input type="text" class="form-control" \
			name="%(fieldname)s"\
			placeholder="%(label)s"\
			value="%(value)s"\
			aria-describedby="basic-addon2">\
			</div>', field_meta)).appendTo($(this.column))
	},
	select_field_renderer: function(field_meta){

	},
	text_field_renderer: function(field_meta){


	},
	date_field_renderer:function(field_meta){
		$form=$(repl_str("<div class='input-group'>\
			<div class='col-md-4'>%(label)s:</div><input type='text' class='form-control' \
			name='%(fieldname)s'\
			placeholder='%(label)s'\
			data-fieldtype='Date'\
			aria-describedby='basic-addon2'>\
			</div>", field_meta)).appendTo($(this.column))

		$form.find("[data-fieldtype='Date']").datepicker({
			altFormat:'yy-mm-dd',
			changeYear: true,
			yearRange: "-70Y:+10Y",	
			dateFormat: 'yy-mm-dd',
		});

		// convert dates to user format
		$form.find("[data-fieldtype='Date']").each(function() {
			var val = $(this).val();
			if(val) {
			$(this).val($.datepicker.formatDate('yy-mm-dd',
				$.datepicker.parseDate("yy-mm-dd", val)));
			}
		})

	},
	button_field_renderer: function(field_meta){

	},
	table_field_renderer: function(){
		$('<div role="tabpanel"><ul class="nav nav-tabs tab-ui" role="tablist"></ul>\
			<div class="tab-content tab-div"></div></div>').appendTo($(this.wrapper))

	},
	section_field_renderer: function(field_meta){
		$(repl_str('<li role="presentation">\
			<a href="#%(fieldname)s" aria-controls="%(fieldname)s"\
			role="tab"\
			data-toggle="tab">%(label)s</a></li>',field_meta)).appendTo($(".tab-ui"))
		$(repl_str('<div role="tabpanel" class="tab-pane " id="%(fieldname)s">\
			</div>',field_meta)).appendTo($(".tab-div"))

		this.wrapper = $(repl_str("#%(fieldname)s",field_meta))
		this.column_break_field_renderer();
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
