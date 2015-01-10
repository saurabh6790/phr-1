frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
// {% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/event.js" %}
{% include "templates/includes/list_view.js" %}
{% include "templates/includes/profile.js" %}





$(document).ready(function () {
	$("#profile").unbind("click").click(function(){
		profile_id=frappe.get_cookie("profile_id")
		console.log(profile_id)
		PatientDashboard.prototype.init($(document).find("#main-con"),"profile",profile_id)
	})
	$('.event').unbind("click").click(function(){
		Event.prototype.init($(document).find("#main-con"))
	})
	$(".create_linkphr").unbind("click").click(function(){
		PatientDashboard.prototype.init($(document).find("#main-con"),"linked_patient")
	})
})

/*<<<<<<< HEAD


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
		$('.controller').bind('click',function(event) {
			if(me.status == 1){
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
=======
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
>>>>>>> c7cf1d3d101d60adf3294bbd8cf9534dfa6558d0
		// .click(function(){
		// 	var res = {};
		// 	$(".tab-pane.active form input, .tab-pane.active form textarea, .tab-pane.active form select").each(function(i, obj) {
		// 		res[obj.name] = $(obj).val();
		// 	})

		// })
	}

})
*/