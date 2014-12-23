frappe.provide("templates/includes");

$(document).ready(function () {
	new frappe.PatientDashboard()
	// var me= this;
	// console.log($(me.document).find("#main-con"))
	// var $content=$(me).find("#main-con")
	// var url='phr/phr/doctype/events/events.json'
	// $("#profile").click(function() {
	// 	frappe.call({
	// 	method:'phr.templates.pages.patient.get_data_to_render',
	// 	callback: function(r){
	// 		 h="";
	// 		 fields=r.message[0]
	// 		 values=r.message[1]
	// 		 for (i=0;i<fields.length;i++){
	// 		 	console.log(fields[i]["fieldtype"])
	// 		 	if (fields[i]["fieldtype"]=="data"){
	// 		 		 h+='<input type="text" value="'+values[fields[i]["fieldname"]]+'"">'
	// 		 	}	
	// 		 }
	// 		 $($content).append(h)
	// 		}
	// 	})
	// 	/*$.getJSON(url,function(){
 //      		console.log("success")
 //    	})
 //    	.fail(function() {
 //    		console.log( "error" );
 // 		 })*/
 
	// 	/*
	// 	var $content=$(document).find("#main-con")
	// 	$("#main-con").html('<object data="profile"/>');*/
 //    });
})


// frappe.PatientDashboard = frappe.RenderFormFields.extend({
// 	init:function(){
// 		console.log("hello world")
// 	}
// })

frappe.PatientDashboard = Class.extend({
	init:function(){
		console.log("test")
	}
})