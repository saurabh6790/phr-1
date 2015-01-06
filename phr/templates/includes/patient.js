frappe.provide("templates/includes");
{% include "templates/includes/inherit.js" %}
// {% include "templates/includes/form_generator.js" %}
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
		/*$('<button type="button" class="btn btn-default" aria-label="Left Align">Save</button>')
		.appendTo($('.form-controller'))	
		.click(function(){
			var res = {};
			$(".tab-pane.active form input, .tab-pane.active form textarea, .tab-pane.active form select").each(function(i, obj) {
				res[obj.name] = $(obj).val();
			})

		})*/
	}

})


var Event = inherit(ListView,{
	init: function(wrapper){
		this.wrapper = wrapper;
		// this.render_field();
		ListView.prototype.init(this.wrapper, {'fields':[
						{'fieldname':'event','fieldtype':'link','label':'Event','options':['Dengue','Headache','Chest Pain']},
						{'fieldname':'description','fieldtype':'text','label':'Description'},
						{'fieldname':'provider_type','fieldtype':'select','label':'Healthcare Provider', 'options':['Doc', 'Hospital', 'Lab']},
						{'fieldname':'','fieldtype':'column_break','label':''},
						{'fieldname':'provider_name','fieldtype':'data','label':'Provider Name'},
						{'fieldname':'number','fieldtype':'data','label':'Contact Number'},
						{'fieldname':'email_id','fieldtype':'data','label':'Email Id'}
					]})
		this.render_spans()
	},
	render_spans: function(){
		var me = this;
		console.log('1')
		console.log()
		$('.controller').bind('click',function(event) {
			console.log('in event js')
			// console.log(['field-area',$('.field-area')])
			console.log(me.status)
				if(me.status == 1){
						console.log($('.sec'))
						// console.log($('div.field-area:last'))
					    $('<div class="event_section1" style = "margin:10%; 10%;">\
					    		<div class="btn btn-success" style = "margin:5%; 5%;height:80px;text-align: center !important;"> Consultancy </div>\
					    		<div class="btn btn-success" style = "margin:5%; 5%;height:80px;text-align: center !important;"> Event Snaps </div>\
					    		<div class="btn btn-success" style = "margin:5%; 5%;height:80px;text-align: center !important;"> Lab Reports </div>\
					    	</div>\
					    	<div class="event_section2" style="margin:10%; 10%;">\
					    		<div class="btn btn-success" style = "margin:5%; 5%;height:80px;text-align: center !important;"> Prescription </div>\
					    		<div class="btn btn-success" style = "margin:5%; 5%;height:80px;text-align: center !important;"> Cost of Care </div>\
					    	</div>').appendTo($('.field-area'))			
			}
		})
		
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
