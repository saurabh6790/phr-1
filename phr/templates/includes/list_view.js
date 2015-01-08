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

		$('.new_controller').remove();
		$('.save_controller').remove();

		$('<div class="new_controller" style="width:45%;display:inline-block;text-align:right;">\
				<button class="btn btn-primary">\
					<i class="icon-plus"></i> New \
				</button>\
			</div>')
			.appendTo($('.sub-top-bar'))
			.bind('click',function(){
				console.log("in ListView js")
				me.new_form()
				me.status=1
				return me.status
			})
	},
	new_form:function(){
		var me = this;
		console.log("in form body")
		RenderFormFields.prototype.init(this.wrapper, {'fields':me.args['fields']})
	}
})