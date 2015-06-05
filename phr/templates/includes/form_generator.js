frappe.provide("templates/includes");

frappe.require("assets/frappe/js/lib/jquery/jquery.ui.min.js");
frappe.require("assets/frappe/js/lib/jquery/bootstrap_theme/jquery-ui.selected.css");
frappe.require("assets/frappe/js/lib/jquery/bootstrap_theme/jquery-ui.css");
frappe.provide("assets/frappe/js/lib/jquery/bootstrap_theme/images");
frappe.require("assets/frappe/js/lib/jquery/jquery.ui.slider.min.js");
frappe.require("assets/frappe/js/lib/jquery/jquery.ui.sliderAccess.js");
frappe.require("assets/frappe/js/lib/jquery/jquery.ui.timepicker-addon.css");
frappe.require("assets/frappe/js/lib/jquery/jquery.ui.timepicker-addon.js");
frappe.require("assets/phr/bootstrap-table.js");
frappe.require("assets/phr/bootstrap-table.css");

var RenderFormFields = function(){
	this.wrapper = ""
}

$.extend(RenderFormFields.prototype,{
	init:function(wrapper, arg, entityid, operation, modal_wrapper){
		//initializing
		
		this.section = '';
		this.column = '';
		this.args = arg;
		this.entityid=entityid;
		this.operation=operation;
		
		if(modal_wrapper) this.wrapper = modal_wrapper.find('.modal-body');
		else this.wrapper=wrapper ? wrapper:$('.field-area') 
		this.result_set = {}
		this.visibility_dict = {}
		this.labelled_section_count = 0;
		

		//crear rendering area
		$(this.wrapper).empty()

		//initiate rendering
		if(!modal_wrapper) this.render_top()
		this.get_field_meta();

	},
	render_top:function(){
		var me = this;
		$('.new_controller').remove();
		$('.save_controller').remove();
		$('#share').remove()
		$('.edit_profile').remove()

		$('<div class="pull-right margin-left-20" id="share">\
			<button class="btn btn-primary">\
			<i class="fa fa-share-square"></i>Share Data</button></div>').appendTo($('.top-btns-bar')).addClass(me.operation)

		
		$('<div class="pull-right margin-left-20 save_controller">\
			<button class="btn btn-primary"><i class="fa fa-save"></i> Save</button></div>').appendTo($('.top-btns-bar')).addClass(me.operation)
		//$('<button class="btn btn-primary pull-right margin-left-20 new_controller"><i class="fa fa-plus-square"></i> New</button>').appendTo($('top-btns-bar')).addClass(me.operation)

		/*$('<div class="save_controller" style="width:45%;display:inline-block;text-align:right;">\
				<button class="btn btn-primary">\
					<i class="icon-save"></i> Save \
				</button>\
			</div>').appendTo($('.sub-top-bar')).addClass(me.operation)*/
	
		
		
	},
	get_field_meta:function(){
		var me = this;
		var arg = {};
		
		console.log("get_field_meta")
		if(me.args){
			arg['data'] = JSON.stringify(me.args)
		}
		if(me.entityid){
			arg['entityid'] = me.entityid
		}
		$.ajax({
			method: "POST",
			url: "/api/method/phr.templates.pages.form_generator.get_data_to_render",
			data: arg,
			async: false,
			success: function(r) {
				me.render_fields(r.message[0], r.message[1],r.message[2])
				if (me.args['param'] == "html_viewer"){
					HTMLViewer.prototype.form_generator_callback(r.message[1])
				}
			}
		});
	},
	render_fields:function(fields, values, tab){
		var me = this;
		// console.log(fields, values, tab)
		if(tab==1) me.tab_field_renderer()
		$.each(fields,function(indx, meta){
			!me.section && meta['fieldtype'] !== 'section_break' && tab!=1 && me.section_break_field_renderer()
			!me.column && me.column_break_field_renderer()
			meta['value']=values[meta['fieldname']] || meta['value'] || "";
			me[meta['fieldtype'] + "_field_renderer"].call(me, meta);
			if(meta['depends_on']) me.depends_on(meta)
		})
	
	},
	check_field_renderer: function(field_meta){
		var me=this;
		$input=$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
								<div class="col-xs-8">\
								<div class="control-input">\
									<input type="checkbox" class="chk" name="%(fieldname)s" value="%(fieldname)s" \
									data-toggle="tooltip" data-placement="top" title="%(label)s">\
									%(label)s\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))
		if(field_meta['required']==1){
			$input.find("input").prop('required',true)
			//$input.find("input").css({"border": "1px solid #999","border-color": "red" });
		}
	},
	depends_on:function(meta){
		parent_field = meta['depends_on'].split(':')[0]

		if(this.visibility_dict[parent_field]) this.set_dict_param(parent_field, meta)
		else{
			this.visibility_dict[parent_field] = {}
			this.set_dict_param(parent_field, meta)	
		}
		this.add_onchange_event(parent_field)
		
	},
	set_dict_param:function(parent_field, meta){
		if(!this.visibility_dict[parent_field][meta['depends_on'].split(':')[1]]){
			this.visibility_dict[parent_field][meta['depends_on'].split(':')[1]] = []
		} 
		this.visibility_dict[parent_field][meta['depends_on'].split(':')[1]].push(meta['fieldname'])
		$($('[name="'+meta['fieldname']+'"]').parents()[3]).css("display", "none");		
	},
	add_onchange_event:function(parent_field){
		var me = this;
		$('[name="'+parent_field+'"]').on('change', function(){
			me.visibility_setter($(this).attr('name'), $(this).val(), me.visibility_dict)
		})
	},
	visibility_setter:function(parent, val, dict_of_fileds){
		$.each(dict_of_fileds[parent], function(key, filed_list){
			$.each(filed_list, function(i,field){
				if(key == val) $($('[name="'+field+'"]').parents()[3]).css("display", "inherit");
				else $($('[name="'+field+'"]').parents()[3]).css("display", "none");
			})	
		})
	},
	set_description:function(area, meta){
		if(meta['description']){
			$('<p class="text-muted small">' + meta['description'] + '</p>')
				.appendTo(area);	
		}
	},
	data_field_renderer: function(field_meta){
		var me=this;
		$input=$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
			<div class="form-group row" style="margin: 0px">\
			<label class="control-label col-xs-4" style="padding-right: 0px;">%(label)s</label>\
			<div class="col-xs-8"><div class="control-input ">\
			<input type="text" class="form-control" placeholder="%(placeholder)s" \
			name="%(fieldname)s" value="%(value)s" data-toggle="tooltip" \
			data-placement="top" title="%(label)s" aria-describedby="basic-addon2" maxlength="30">\
			<span id="valid"></span></div></div></div></div>', field_meta)).appendTo($(this.column))
		
		var val = field_meta['value'];
		if(field_meta['required']==1){
		    $input.find("input").prop('required',true)
		    // $input.find("label").addClass('required')
			// $('<style>.required:after{content:" *";color:red;font-size:20px;}</style>').appendTo($input)
			$('<span class="symbol required"></span>').appendTo($input.find("label"));
			/*if (!val){
				$input.find("input").css({"border": "1px solid #999","border-color": "red" });
			}*/	
		}
		if(field_meta['display']){
			$($('[name="'+field_meta['fieldname']+'"]').parents()[3]).css("display", field_meta['display']);
		}
		if(field_meta['readonly']==1){
			$input.find("input").prop('disabled',true)
		}

		this.set_description($input.find('.control-input'), field_meta)
	},
	password_field_renderer: function(field_meta){
		var me=this;
		$input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
			<div class="form-group row" style="margin: 0px">\
			<label class="control-label col-xs-4" style="padding-right: 0px;">%(label)s</label>\
			<div class="col-xs-8"><div class="control-input">\
			<input type="password" class="form-control disable" placeholder="%(placeholder)s" \
			name="%(fieldname)s" data-toggle="tooltip" data-placement="top" title="%(label)s" \
			aria-describedby="basic-addon2"></div></div></div></div>', field_meta)).appendTo($(this.column))

		var val = field_meta['value'];
		if(field_meta['required']==1){
		    $input.find("input").prop('required',true)
		    $input.find("label").addClass('required')
			// $('<style>.required:after{content:" *";color:red;font-size:20px;}</style>').appendTo($input)
			$('<span class="symbol required"></span>').appendTo($input.find("label"));
			/*if (!val){
				$input.find("input").css({"border": "1px solid #999","border-color": "red" });
			}*/	
		}
		if(field_meta['readonly']==1){
			$input.find("input").prop('disabled',true)
		}

		var controls = $(".disable");
        controls.bind("paste", function () {
            return false;
        });
        controls.bind("drop", function () {
            return false;
        });
        controls.bind("cut", function () {
            return false;
        });
        controls.bind("copy", function () {
            return false;
        });

		this.set_description($input.find('.control-input'), field_meta)
	},
	html_field_renderer: function(field_meta){
		var me=this;
		$input=$(repl_str('<div class="%(fieldname)s"></div>', field_meta)).appendTo($(this.column))
	},
	email_field_renderer: function(field_meta){
		var me=this;
		$input=$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
			<div class="form-group row" style="margin: 0px">\
			<label class="control-label col-xs-4" style="padding-right: 0px;">%(label)s</label>\
			<div class="col-xs-8"><div class="control-input">\
			<input type="email" class="form-control" placeholder="%(placeholder)s" \
			name="%(fieldname)s" value="%(value)s" data-toggle="tooltip" data-placement="top" title="%(label)s" \
			aria-describedby="basic-addon2"></div></div></div></div>', field_meta)).appendTo($(this.column))

		var val = field_meta['value'];
		if(field_meta['required']==1){
			$input.find("input").prop('required',true)
			$input.find("label").addClass('required')
			// $('<style>.required:after{content:" *";color:red;font-size:20px;}</style>').appendTo($input)
			$('<span class="symbol required"></span>').appendTo($input.find("label"));
			/*if (!val){
				$input.find("input").css({"border": "1px solid #999","border-color": "red" });
			}*/	
		}
		if(field_meta['readonly']==1){
			$input.find("input").prop('disabled',true)
		}

		this.set_description($input.find('.control-input'), field_meta)
	},
	select_field_renderer: function(field_meta){
		$input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
			<div class="form-group row" style="margin: 0px">\
			<label class="control-label col-xs-4" style="padding-right: 0px;">%(label)s</label>\
			<div class="col-xs-8 weight_mngnt"><div class="control-input">\
			<select type="text" class="form-control" data-toggle="tooltip" \
			data-placement="top" title="%(label)s" name="%(fieldname)s" ></div></div></div></div>', field_meta)).appendTo($(this.column))


		if (typeof(field_meta['options']) === "string"){
			$loc_ip = $input;
			$.ajax({
				method: "POST",
				url: "/api/method/phr.templates.pages.utils.get_master_details",
				data: {'doctype': field_meta['options']},
				async: false,
				success: function(r) {
					$option=$('<option>', { 
								'value': "",
								'text' : "" 
							}).appendTo($($loc_ip.find('select')))
					$.each(r.message,function(i, val){
						$option=$('<option>', { 
							'value': val,
							'text' : val 
						}).appendTo($($loc_ip.find('select')))
						if (field_meta['value']==val){
						 $option.attr('selected','selected')
						}
						$option.appendTo($($loc_ip.find('select')))
					})
				}
			})
		}
		else{
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
		}
		
		var val = field_meta['value'];
		if(field_meta['required']==1){
			$input.find("select").prop('required',true)
			$input.find(".control-label").addClass('required')
			// $('<style>.required:after{content:" *";color:red;font-size:20px;}</style>').appendTo($input)
			$('<span class="symbol required"></span>').appendTo($input.find("label"));
			/*if (!val){
				$input.find("select").css({"border": "1px solid #999","border-color": "red" });
			}*/
		}
		if(field_meta['readonly']==1){
			$input.find("select").prop('disabled',true)
		}

		this.set_description($input.find('.control-input'), field_meta)

	},
	link_field_renderer: function(field_meta){
		var me = this;
		var $input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<input type="text" class="form-control autocomplete" \
										placeholder="%(placeholder)s" name="%(fieldname)s" value="%(value)s" \
										data-toggle="tooltip" data-placement="top" title="%(label)s"\
										aria-describedby="basic-addon2" >\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))

		frappe.require("/assets/phr/js/jquery.autocomplete.multiselect.js");
		

		if (typeof(field_meta['options']) === "string"){
			frappe.call({
				method:'phr.templates.pages.utils.get_master_details',
				args:{'doctype': field_meta['options']},
				callback: function(r){
					$($input.find('.autocomplete')).autocomplete({
						open: function(){
							setTimeout(function () {
								$('.ui-autocomplete').css('z-index', 99999999999999);
							}, 0);
						},
						source: r.message,
						multiselect: field_meta['multiselect'] == "false" ? false:true
					});
				}
			})
		}
		
		else{
			$($input.find('.autocomplete')).autocomplete({
				source: field_meta['options'],
				multiselect: field_meta['multiselect']
			});
		}
		var val = field_meta['value'];
		if(field_meta['required']==1){
			$input.find("input").prop('required',true)
			// $input.find("label").addClass('required')
			// $('<style>.required:after{content:" *";color:red;font-size:20px;}</style>').appendTo($input)
			$('<span class="symbol required"></span>').appendTo($input.find("label"));
			/*if (!val){
				$input.find("input").css({"border": "1px solid #999","border-color": "red" });
			}*/
		}

		this.set_description($input.find('.control-input'), field_meta)

		if(typeof(field_meta['value']) === "object"){
			$.each(field_meta['value'], function(i,j){
				$('<div class="ui-autocomplete-multiselect-item">'+j+'\
					<span class="ui-icon ui-icon-close"></span>\
				</div>').appendTo($input.find('.ui-autocomplete-multiselect'))	
			})
			
		}
		if(field_meta['readonly']==1){
			$input.find("input").prop('disabled',true)
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
		var me = this;
		$input=$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<textarea maxlength="160" type="text" class="form-control" \
										placeholder="%(placeholder)s" name="%(fieldname)s"\
										data-toggle="tooltip" data-placement="top" title="%(label)s"\
										aria-describedby="basic-addon2"></textarea>\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))
		$input.find("textarea").val(field_meta['value'])
		var val = field_meta['value'];
		if(field_meta['required']==1){
			$input.find("textarea").prop('required',true)
			// $input.find("label").addClass('required')
			// $('<style>.required:after{content:" *";color:red;font-size:20px;}</style>').appendTo($input)
			$('<span class="symbol required"></span>').appendTo($input.find("label"));
			/*if (!val){
				$input.find("textarea").css({"border": "1px solid #999","border-color": "red" });
			}*/
		}

		if(field_meta['display']){
			$($('[name="'+field_meta['fieldname']+'"]').parents()[3]).css("display", field_meta['display']);
		}
		if(field_meta['readonly']==1){
			$input.find("textarea").prop('disabled',true)
		}

		this.set_description($input.find('.control-input'), field_meta)
	},
	button_field_renderer: function(field_meta){
		$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
			<div class="form-group row" style="margin: 0px"><div class="col-xs-8">\
			<div class="%(fieldname)s" style="margin-right:0px;float:right;"><button class="btn btn-primary"> %(label)s</button>\
			</div></div></div></div>',field_meta)).appendTo($(this.column))

	},
	attach_field_renderer:function(field_meta){
		$('<div class="fileinput fileinput-exists" data-provides="fileinput">\
			<div class="fileinput-new thumbnail" style="width: 200px; height: 150px;">\
			 <img data-src="holder.js/100%x100%" alt="...">\
			 </div>\
			 <div class="fileinput-preview fileinput-exists thumbnail" style="max-width: 200px; max-height: 150px;"></div>\
            <div><span class="btn btn-default btn-file"><span class="fileinput-new">Select image</span>\
            <span class="fileinput-exists">Change</span>\
            <input type="file" name="..."></span>\
 			 <a href="#" class="btn btn-default fileinput-exists" data-dismiss="fileinput">Remove</a>\
 			 </div>\
 			 <div class="upload"><span class="btn btn-default fileinput-exists">Upload</span></div>\
 			</div>').appendTo($(this.column))
		/*$('.fileinput').fileinput()*/
	},
	time_field_renderer:function(field_meta){
		var me = this;
		$input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<input type="text" class="form-control" \
										placeholder="%(placeholder)s" name="%(fieldname)s" data-fieldtype="time" >\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))

		$( $input.find('[data-fieldtype="time"]' )).datetimepicker({
						dateFormat: '',
        				timeFormat: 'hh:mm tt',
        				timeOnly: true
		})
		var val = field_meta['value'];
		if(field_meta['required']==1){
			$input.find("input").prop('required',true);
			$('<span class="symbol required"></span>').appendTo($input.find("label"));
		}
		if(field_meta['readonly']==1){
			$input.find("input").prop('disabled',true)
		}

		this.set_description($input.find('.control-input'), field_meta)
	},
	date_field_renderer:function(field_meta){
		var me = this;
		$input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<input type="text" class="form-control" \
										placeholder="%(placeholder)s" name="%(fieldname)s" data-fieldtype="Date" >\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))

		$( $input.find('[data-fieldtype="Date"]' )).datepicker({
						altFormat:'yy-mm-dd',
						changeYear: true,
						yearRange: "-70Y:+10Y",
						dateFormat: "dd/mm/yy"
					})
			var val = field_meta['value'];

			if(val){
				if (typeof(val)=="string"){
					dt = val.split("/");
					var date = new Date(dt[2], dt[1] - 1, dt[0]);
				}
				else{
					var date=new Date(val)
				}
				$input.find('input').val($.datepicker.formatDate('dd/mm/yy',date))
			}
		if(field_meta['required']==1){
			$input.find("input").prop('required',true);
			// $input.find("label").addClass('required')
			// $('<style>.required:after{content:" *";color:red;font-size:20px;}</style>').appendTo($input)
			$('<span class="symbol required"></span>').appendTo($input.find("label"));
		}
		if(field_meta['readonly']==1){
			$input.find("input").prop('disabled',true)
		}

		if(field_meta['display']){
			$($('[name="'+field_meta['fieldname']+'"]').parents()[3]).css("display", field_meta['display']);
		}

		this.set_description($input.find('.control-input'), field_meta)
	},
	datetime_field_renderer:function(field_meta){
		var me = this;
		$input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<input type="text" class="form-control" \
										placeholder="%(placeholder)s" name="%(fieldname)s" data-fieldtype="DateTime" >\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))

		$( $input.find('[data-fieldtype="DateTime"]' )).datetimepicker({
						altFormat:'yy-mm-dd',
						changeYear: true,
						yearRange: "-70Y:+10Y",
						dateFormat: "dd/mm/yy",
						timeFormat:  "HH:mm"
					})
		var val = field_meta['value'];
		
		if(val){
			var date=new Date(val)
			$input.find('input').val($.datetimepicker.formatDate('dd/mm/yy',date))
		}
		if(field_meta['readonly']==1){
			$input.find("input").prop('disabled',true)
		}

		if(field_meta['required']==1){
			$input.find("input").prop('required',true);
			// $input.find("label").addClass('required')
			// $('<style>.required:after{content:" *";color:red;font-size:20px;}</style>').appendTo($input)
			$('<span class="symbol required"></span>').appendTo($input.find("label"));
			/*if (!val){
				$input.find("input").css({"border": "1px solid #999","border-color": "red" });	
			}*/
		}

		this.set_description($input.find('.control-input'), field_meta)
	},
	time_field_renderer:function(field_meta){
		var me = this;
		$input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<input type="text" class="form-control" \
										placeholder="%(placeholder)s" name="%(fieldname)s" data-fieldtype="time" >\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))

		$( $input.find('[data-fieldtype="time"]' )).datetimepicker({
						dateFormat: '',
        				timeFormat: 'hh:mm tt',
        				timeOnly: true
		})
		var val = field_meta['value'];
		
		/*if(val){
			var date=new Date(val)
			$input.find('input').val($.datetimepicker.formatDate('dd/mm/yy',date))
		}
*/
		if(field_meta['required']==1){
			$input.find("input").prop('required',true);
			// $input.find("label").addClass('required')
			// $('<style>.required:after{content:" *";color:red;font-size:20px;}</style>').appendTo($input)
			$('<span class="symbol required"></span>').appendTo($input.find("label"));
			/*if (!val){
				$input.find("input").css({"border": "1px solid #999","border-color": "red" });	
			}*/
		}
		if(field_meta['readonly']==1){
			$input.find("input").prop('disabled',true)
		}

		this.set_description($input.find('.control-input'), field_meta)
	},
	table_field_renderer:function(field_meta){
		var me = this;
		$input = $(repl_str('<table class="table table-striped" data-pagination="true" data-search="true"\
						data-height="550"  style="padding=0px; " >\
						<thead><tr></tr></thead>\
						<tbody></tbody>\
					</table>\
				',field_meta)).appendTo($(this.column))

		this.cols = [];
		this.data_row = [];

		$.each(field_meta['rows'],function(i, val){
			(i==0) ? me.render_table_heads(val, $input) : me.render_table_body(val, field_meta['rows'][0], $input)
		})
		$('table').bootstrapTable({
			columns: me.cols,
			data: me.data_row
		})

	},
	render_table_heads:function(val, input_area){
		var me = this;
		$.each(val,function(i, d){
			// $("<th>").html(d)
			// 	.appendTo($(input_area).find("thead tr"));
			me.cols.push({"field": i, "title": d})
		})
	},
	render_table_body:function(val, cols, input_area){
		var me = this;
		var dict = {};
		// 
		$.each(val,function(i, d){
			// $("<td>").html(d)
			// 	.appendTo(row);
			dict[i] = d; 
		})
		me.data_row.push(dict)
	},
	tab_field_renderer: function(){
		$('<div role="tabpanel">\
				<ul class="nav nav-tabs tab-ui" role="tablist" data-tabs="tabs"></ul>\
				<div class="tab-content tab-div"></div>\
			</div>').appendTo($(this.wrapper))

	},
	section_field_renderer: function(field_meta){
		if(field_meta['default']==1){
			$(repl_str('<li role="presentation" class="active">\
						<a href="#%(fieldname)s" aria-controls="%(fieldname)s"\
							role="tab" data-toggle="tab">%(section_title)s</a>\
					</li>',field_meta)).appendTo($(".tab-ui"))
	
			$(repl_str('<div role="tabpanel" class="tab-pane active" id="%(fieldname)s">\
			</div>',field_meta)).appendTo($(".tab-div"))
		}
		else{
			$(repl_str('<li role="presentation">\
						<a href="#%(fieldname)s" aria-controls="%(fieldname)s"\
							role="tab" data-toggle="tab">%(section_title)s</a>\
					</li>',field_meta)).appendTo($(".tab-ui"))
	
			$(repl_str('<div role="tabpanel" class="tab-pane " id="%(fieldname)s">\
			</div>',field_meta)).appendTo($(".tab-div"))
		}

		this.wrapper = $(repl_str("#%(fieldname)s",field_meta))
		this.section_break_field_renderer(field_meta);
		this.column_break_field_renderer();
	},
	column_break_field_renderer: function(field_meta){
        this.column = $('<div class="form-column" >\
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
    section_break_field_renderer: function(meta){
       	$input = $('<div class="panel panel-white no-radius events  sec %(fieldname)s"><div class="panel-heading border-light he"></div><div class="panel-body bod"> </div>').appendTo($(this.wrapper))
  		this.section=$input.find($('.bod'))
        
      	if(meta){
        	if(meta['label']){
          		this.labelled_section_count++;
          		var $head = $('<h4 class="panel-title">'
            	+ (meta['options'] ? (meta['options']) : "")
            	+"  "
            	+ meta['label']
            	+ "</h4>")
            	.appendTo($input.find($('.he')));
	        }
    	    if(meta['display']){
        		$(this.section).css("display", meta['display']);
        		$(this.section).addClass(meta['fieldname'])
      		} 
      	}      
    	
    	this.column = null;
    		
    }
})
