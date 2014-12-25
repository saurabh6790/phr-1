frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
frappe.require("assets/frappe/js/lib/jquery/jquery.ui.min.js");
frappe.require("assets/frappe/js/lib/jquery/bootstrap_theme/jquery-ui.selected.css");
frappe.require("assets/frappe/js/lib/jquery/bootstrap_theme/jquery-ui.css");
frappe.provide("assets/frappe/js/lib/jquery/bootstrap_theme/images");

var RenderFormFields = function(){
	this.wrapper = ""
}

$.extend(RenderFormFields.prototype,{
	init:function(wrapper, arg){
		this.wrapper = wrapper;
		this.column = '';
		this.args = arg;

		$(this.wrapper).empty()

		this.get_field_meta();
	} ,
	get_field_meta:function(){
		var me = this;
		frappe.call({
			method:'phr.templates.pages.patient.get_data_to_render',
			args:{'data': me.args},
			callback: function(r){
				me.render_fields(r.message[0], r.message[1],r.message[2])
			}
		})
	},
	render_fields:function(fields, values, tab){
		var me = this;

		if(tab==1) me.tab_field_renderer()
		else !this.column && this.column_break_field_renderer()

		$.each(fields,function(indx, meta){
			meta['value']=values[meta['fieldname']] || "";
			me[meta['fieldtype'] + "_field_renderer"].call(me, meta);
		})
	},
	data_field_renderer: function(field_meta){
		$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label small col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<input type="text" class="form-control" \
										placeholder="%(label)s" name="%(fieldname)s" value="%(value)s" \
										aria-describedby="basic-addon2">\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))
	},
	select_field_renderer: function(field_meta){
		$input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label small col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<select type="text" class="form-control" \
										name="%(fieldname)s" >\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))
		
		$.each(field_meta['options'],function(i, val){
				$('<option>', { 
					'value': val,
					'text' : val 
				}).appendTo($($input.find('select')))
			
		})

	},
	link_field_renderer: function(field_meta){
		var me = this;
		console.log(frappe.ui)
		// frappe.ui.form.make_control({
		// 		df: {
		// 		    "fieldtype": 'Link',
		// 			"fieldname": 'event',
		// 			"options": 'Event',
		// 			"label": 'event'
		// 			},
		// 		parent: $(me.column),
		// 	}).make_input();
	},
	text_field_renderer: function(field_meta){
		$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label small col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<textarea type="text" class="form-control" \
										placeholder="%(label)s" name="%(fieldname)s" value="%(value)s" \
										aria-describedby="basic-addon2"></textarea>\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))
	},
	button_field_renderer: function(field_meta){

	},
	date_field_renderer:function(field_meta){
		var me = this;
		$input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label small col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<input type="text" class="form-control" \
										placeholder="%(label)s" name="%(fieldname)s" data-fieldtype="Date" >\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))

		$( $input.find('[data-fieldtype="Date"]' )).datepicker({
						altFormat:'yy-mm-dd',
						changeYear: true,
						yearRange: "-70Y:+10Y",
						dateFormat: "dd/mm/yy",
					})
	},
	table_field_renderer:function(field_meta){

	},
	tab_field_renderer: function(){
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
        this.column = $('<div class="form-column" style="margin-top:10px;">\
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
