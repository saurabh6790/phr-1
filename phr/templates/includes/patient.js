frappe.provide("templates/includes");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/form_generator.js" %}

$(document).ready(function () {
	new PatientDashboard($(document).find("#main-con"))
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
