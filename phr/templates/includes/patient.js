frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
// {% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/event.js" %}
{% include "templates/includes/visit.js" %}
{% include "templates/includes/list_view.js" %}
{% include "templates/includes/profile.js" %}
{% include "templates/includes/linked_phr.js" %}
{% include "templates/includes/provider.js" %}

/*
  Format for method Classes
  ClassName.prototype.init(wrapper,name_of_json_file,entityid,operation_entity)
*/
$(document).ready(function () {
	profile_id=frappe.get_cookie("profile_id")
	console.log(profile_id)
	$("#profile").unbind("click").click(function(){
		console.log(profile_id)
		PatientDashboard.prototype.init($(document).find("#main-con"),
			{"file_name" : "profile", "method": "profile"},profile_id)
	})
	$('.event').unbind("click").click(function(){
		
		$('.breadcrumb').empty()

		$('<li><a nohref>Event</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			Event.prototype.init($(document).find("#main-con"), '', profile_id)
		}).appendTo('.breadcrumb');
		
		Event.prototype.init($(document).find("#main-con"), '', profile_id)
	})
	$('.visit').unbind("click").click(function(){
		$('.breadcrumb').empty()
		// frappe.require("/assets/phr/js/tree.jquery.js");
		// frappe.require("/assets/phr/jqtree.css");
		// $('<div id="tree1"> test </div>').appendTo($(document).find(".form-controller"))
		// var data = [
		// 	{
		// 		label: 'node1',
		// 		children: [
		// 			{ label: 'child1' },
		// 			{ label: 'child2' }
		// 		]
		// 	},
		// 	{
		// 		label: 'node2',
		// 		children: [
		// 			{ label: 'child3' }
		// 		]
		// 	}
		// ];	

		// $(function() {
		// 	$('#tree1').tree({
		// 		data: data
		// 	});
		// });
		$('<li><a nohref>Visit</a></li>').click(function(){
			$('.breadcrumb li').nextAll().remove()
			Visit.prototype.init($(document).find("#main-con"), '', profile_id)
		}).appendTo('.breadcrumb');
		
		Visit.prototype.init($(document).find("#main-con"), '', profile_id)
	})
	$(".create_linkphr").unbind("click").click(function(){
		LinkedPHR.prototype.init($(document).find("#main-con"),
			{"file_name" : "linked_patient"},"","create_linkphr")
	})
	$(".open_linkphr").unbind("click").click(function(){
		LinkedPHR.prototype.init($(document).find("#main-con"), 
			{"file_name" : "linked_patient"},"","open_linkphr")
	})
	$(".create_provider").unbind("click").click(function(){
		Provider.prototype.init($(document).find("#main-con"),
			{"file_name" : "provider"})
	})
	$(".open_provider").unbind("click").click(function(){
		Provider.prototype.init($(document).find("#main-con"), 
			{"file_name" : "provider"})
	})
})
