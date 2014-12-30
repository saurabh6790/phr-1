frappe.provide("templates/includes");
{% include "templates/includes/inherit.js" %}
// {% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list_view.js" %}


$(document).ready(function () {
	$("#profile").unbind("click").click(function(){
		new PatientDashboard($(document).find("#main-con"))
	})
	$('.event').unbind("click").click(function(){
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
		$('.form-controller').append("<div><h1>YESSSSS</h1></div>")
		$('<button type="button" class="btn btn-default" aria-label="Left Align">SAve</button>')
		.appendTo($('.form-controller'))	
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


var Event = inherit(ListView,{
	init: function(wrapper){
		console.log('t1')
		this.wrapper = wrapper;
		this.render_field();
		ListView.prototype.init(this.wrapper, {'fields':[
						{'fieldname':'event','fieldtype':'link','label':'Event','options':['Dengue','Headache','Chest Pain']},
						{'fieldname':'description','fieldtype':'text','label':'Description'},
						{'fieldname':'provider_type','fieldtype':'select','label':'Healthcare Provider', 'options':['Doc', 'Hospital', 'Lab']},
						{'fieldname':'provider_name','fieldtype':'data','label':'Provider Name'},
						{'fieldname':'number','fieldtype':'data','label':'Contact Number'},
						{'fieldname':'email_id','fieldtype':'data','label':'Email Id'}
					]})
		// this.render_field()
	},
	render_field: function(){
		// $('<button type="button" class="btn btn-default" aria-label="Left Align">')
		// .appendTo($(this.wrapper))	
		// .click(function(){
		// 	var res = {};
		// 	$("form input").each(function(i, obj) {
		// 		res[obj.name] = $(obj).val();
		// 	})
		// 	console.log(res)
		// 	// console.log($('form').serialize())
		// })
	}
})
