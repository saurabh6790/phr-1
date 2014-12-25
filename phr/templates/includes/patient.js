frappe.provide("templates/includes");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/form_generator.js" %}

$(document).ready(function () {
	$("#profile").click(function(){
		new PatientDashboard($(document).find("#main-con"))
	})
	$('.event').click(function(){
		new Event($(document).find("#main-con"))
	})
})

var PatientDashboard = inherit(RenderFormFields, {
	init: function(wrapper){
		this.wrapper = wrapper;
		this.render_field();
		RenderFormFields.prototype.init(this.wrapper)
		this.render_field()
	},
	render_field: function(){
		$(this.wrapper).append("<div><h1>YESSSSS</h1></div>")
		$('<button type="button" class="btn btn-default" aria-label="Left Align">SAve</button>')
		.appendTo($(this.wrapper))	
		.click(function(){
			var res = {};
			$("form input, form textarea").each(function(i, obj) {
				res[obj.name] = $(obj).val();
			})

			console.log(res)
			// console.log($('form').serialize())
		})
	}

})


var Event = inherit(RenderFormFields,{
	init: function(wrapper){
		this.wrapper = wrapper;
		this.render_field();
		RenderFormFields.prototype.init(this.wrapper, {'fields':[{'fieldname':'event','fieldtype':'data','label':'Event'}, 
			{'fieldname':'date','fieldtype':'data','label':'Date'}]})
		this.render_field()
	},
	render_field: function(){
		$('<button type="button" class="btn btn-default" aria-label="Left Align">')
		.appendTo($(this.wrapper))	
		.click(function(){
			var res = {};
			$("form input").each(function(i, obj) {
				res[obj.name] = $(obj).val();
			})
			console.log(res)
			// console.log($('form').serialize())
		})
	}
})