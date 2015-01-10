frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
// {% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/event.js" %}
{% include "templates/includes/list_view.js" %}




$(document).ready(function () {
	$("#profile").unbind("click").click(function(){
		PatientDashboard.prototype.init($(document).find("#main-con"),"profile")
	})
	$('.event').unbind("click").click(function(){
		Event.prototype.init($(document).find("#main-con"))
	})
	$(".create_linkphr").unbind("click").click(function(){
		PatientDashboard.prototype.init($(document).find("#main-con"),"linked_patient")
	})
})

var PatientDashboard = inherit(RenderFormFields, {
	init: function(wrapper,cmd){
		this.wrapper = wrapper;
		this.args=cmd
		RenderFormFields.prototype.init(this.wrapper,this.args)
		this.render_field()
	},
	render_field: function(){
		// $('<button type="button" class="btn btn-default" aria-label="Left Align">Save</button>')
		// .appendTo($('.form-controller'))	
		// .click(function(){
		// 	var res = {};
		// 	$(".tab-pane.active form input, .tab-pane.active form textarea, .tab-pane.active form select").each(function(i, obj) {
		// 		res[obj.name] = $(obj).val();
		// 	})

		// })
	}

})