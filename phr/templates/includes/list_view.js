frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}

var ListView = inherit(RenderFormFields,{
	init: function(wrapper, args){
		console.log(args)
		this.wrapper = wrapper;
		this.args = args;

		RenderFormFields.prototype.init(this.wrapper, {'fields':[{'fieldname':'event','fieldtype':'link','label':'Event','options':'Events'},
			{'fieldname':'','fieldtype':'column_break','label':''},
			{'fieldname':'date','fieldtype':'date','label':'Date'},
			{'fieldname':'','fieldtype':'section_break','label':''},
			{'fieldname':'tab','fieldtype':'table','label':'T1', 'options':[['Event Date', 'Event Name', 'Provider Type', 'Provider Name', 'Consultancy', 'Event Snaps', 'Lab Reports', 'Prescription', 'Cost of Care'],['1234569', 'Saurabh', '24']]}]})
		
		
		this.render_top_section()
	},
	render_top_section: function(){
		var me = this;

		console.log($('.sub-top-bar.btn'))

		$('.controller').remove();

		$('<div class="controller" style="width:45%;display:inline-block;text-align:right;">\
				<button class="btn btn-primary">\
					<i class="icon-plus"></i> New \
				</button>\
			</div>')
			.appendTo($('.sub-top-bar'))
			.click(function(){
				me.new_form()
			})
	},
	new_form:function(){
		var me = this;
		RenderFormFields.prototype.init(this.wrapper, {'fields':me.args['fields']})
	}
})