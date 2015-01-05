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
		//initializing
		this.section = '';
		this.column = '';
		this.args = arg;
		this.wrapper = $('.field-area')
		this.result_set = {}

		//crear rendering area
		$(this.wrapper).empty()

		//initiate rendering
		this.render_top()
		this.get_field_meta();

	},
	render_top:function(){
		$('.controller').remove();

		$('<div class="controller" style="width:45%;display:inline-block;text-align:right;">\
				<button class="btn btn-primary">\
					<i class="icon-save"></i> Save \
				</button>\
			</div>')
			.appendTo($('.sub-top-bar'))
			.click(function(){
				me.result_set = {}
				$("form input, form textarea").each(function(i, obj) {
					me.result_set[obj.name] = $(obj).val();
				})
			})

	},
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
		// console.log([fields, this.column])
		$.each(fields,function(indx, meta){
			!me.section && me.section_break_field_renderer()
			!me.column && me.column_break_field_renderer()
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
				$option=$('<option>', { 
					'value': val,
					'text' : val 
				}).appendTo($($input.find('select')))
				if (field_meta['value']==val){
				 $option.attr('selected','selected')
				}
				$option.appendTo($($input.find('select')))
				
			
		})

	},
	link_field_renderer: function(field_meta){
		var me = this;
		var $input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label small col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<input type="text" class="form-control autocomplete" \
										placeholder="%(label)s" name="%(fieldname)s" value="%(value)s" \
										aria-describedby="basic-addon2">\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))

		if (typeof(field_meta['options']) === String){
			frappe.call({
				method:'phr.templates.pages.patient.get_master_details',
				args:{'doctype': field_meta['options']},
				callback: function(r){
					console.log([r.message, $($input.find('.autocomplete'))])
					$($input.find('.autocomplete')).autocomplete({
						source: r.message,
					});
				}
			})
		}
		
		else{
			$($input.find('.autocomplete')).autocomplete({
				source: field_meta['options'],
			});
		}

		// $($input.find('.autocomplete')).autocomplete({
  //       source: function(request, response){
  //           var matcher = new RegExp( $.ui.autocomplete.escapeRegex( request.term ), "i" );
  //           response( $.grep( field_meta['options'], function( value ) {
  //           return matcher.test(value['constructor']) || matcher.test(value.model) || matcher.test(value.type);
  //       }));
  //       }
    // });
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
		var me = this;
		$input = $(repl_str('<div class="panel panel-primary" style="height:100%;margin-top:10px;">\
				<div class="panel-heading">%(label)s</div>\
				<div class="panel-body" style="padding:1px;height:180px;overflow:hidden;overflow:auto">\
					<table class="table table-striped" style="padding=0px;" >\
						<thead><tr></tr></thead>\
						<tbody></tbody>\
					</table>\
				</div>\
			</div>',field_meta)).appendTo($(this.column))

		$.each(field_meta['options'],function(i, val){
			(i==0) ? me.render_table_heads(val, $input) : me.render_table_body(val, $input)
		})

	},
	render_table_heads:function(val, input_area){
		$.each(val,function(i, d){
			$("<th>").html(d)
				.appendTo($(input_area).find("thead tr"));
		})
	},
	render_table_body:function(val, input_area){
		var row = $("<tr>").appendTo($(input_area).find("tbody"));
		$.each(val,function(i, d){
			$("<td>").html(d)
				.appendTo(row);
		})
	},
	tab_field_renderer: function(){
		$('<div role="tabpanel">\
				<ul class="nav nav-tabs tab-ui" role="tablist"></ul>\
				<div class="tab-content tab-div"></div>\
			</div>').appendTo($(this.wrapper))

	},
	section_field_renderer: function(field_meta){
		$(repl_str('<li role="presentation">\
						<a href="#%(fieldname)s" aria-controls="%(fieldname)s"\
							role="tab" data-toggle="tab">%(label)s</a>\
					</li>',field_meta)).appendTo($(".tab-ui"))

		$(repl_str('<div role="tabpanel" class="tab-pane " id="%(fieldname)s">\
			</div>',field_meta)).appendTo($(".tab-div"))

		this.wrapper = $(repl_str("#%(fieldname)s",field_meta))
		this.section_break_field_renderer();
		this.column_break_field_renderer();
	},
	column_break_field_renderer: function(field_meta){
        this.column = $('<div class="form-column" style="margin-top:10px;">\
            				<form>\
							</form>\
					</div>').appendTo($(this.section))
					.find("form")
					.on("submit", function() { return false; })
			   // distribute all columns equally
		var colspan = cint(12 / $(this.section).find(".form-column").length);
		$(this.section).find(".form-column").removeClass()
			.addClass("form-column")
			.addClass("col-md-" + colspan);
    },
    section_break_field_renderer: function(){
    	console.log(['section', this.wrapper])

    	this.section = $('<div class="row"></div>')
    		.appendTo($(this.wrapper))
    		.css("border-top", "1px solid #eee")
    		.css("padding-top", "15px")

    	this.column = null;
    		
    }
})
