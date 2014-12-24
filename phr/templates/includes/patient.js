frappe.provide("templates/includes");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/form_generator.js" %}

$(document).ready(function () {
	new PatientDashboard($(document).find("#main-con"))
	$('.event').click(function(){
		new Event($(document).find("#main-con"))
	})
})

var PatientDashboard = inherit(RenderFormFields, {
	init: function(wrapper){
		this.wrapper = wrapper;
		this.render_field();
		RenderFormFields.prototype.init(this.wrapper)
	},
	render_field: function(){
		$(this.wrapper).append("<div><h1>YESSSSS</h1></div>")
	}

})


var Event = inherit(RenderFormFields,{
	init: function(wrapper){
		this.wrapper = wrapper;
		this.render_field();
		RenderFormFields.prototype.init(this.wrapper, {'fields':[{'fieldname':'event','fieldtype':'data','label':'Event'}, 
			{'fieldname':'date','fieldtype':'data','label':'Date'}]})
	},
	render_field: function(){
		$(this.wrapper).append("<div><h1>Event</h1></div>")	
	}
})