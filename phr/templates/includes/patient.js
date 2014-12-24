frappe.provide("templates/includes");

$(document).ready(function () {
	var me= this;
	console.log($(me.document).find("#main-con"))
	var $content=$(me).find("#main-con")
	var url='phr/phr/doctype/events/events.json'
	$("#profile").click(function() {
		frappe.call({
		method:'phr.templates.pages.patient.get_data_to_render',
		callback: function(r){
			 h="";
			 fields=r.message[0]
			 values=r.message[1]
			 tab=r.message[2]
			 var count=0
			 if (tab==1){
			 	h+='<div role="tabpanel"><ul class="nav nav-tabs tabui" role="tablist"></ul><div class="tab-content"></div>'
			 	$($content).append(h)
			 	var $li=$(document).find(".tabui")
			 	var $tab-content=$(document).find(".tab-content")
			 }
			 for (i=0;i<fields.length;i++){
			 	var value=(values[fields[i]["fieldname"]]? values[fields[i]["fieldname"]]:"");
			 	if (tab==1){

			 	 		if (fields[i]["fieldtype"]=="Section Break"){
			 				$('<li role="presentation" class="active"><a href="#'+fields[i]["fieldname"]+'" aria-controls="home" role="tab" data-toggle="tab">'+fields[i]["fieldname"]+'</a></li>').appendTo($li)
			 			}
			 			if (fields[i]["fieldtype"]=="data"){
			 				var tabdiv='<div><label>'+fields[i]["label"]+'</label><input class="form-control" style="width:30%" placeholder="'+fields[i]["label"]+'" value="'+value+'"></div>'
			 			}

			 		}
			 		h +='<div class="form-group">'
			 		if (fields[i]["fieldtype"]=="data"){
			 			h+='<div><label>'+fields[i]["label"]+'</label><input class="form-control" style="width:30%" placeholder="'+fields[i]["label"]+'" value="'+value+'"></div>'
			 		}
			 	}
			 		
			 }
			 
			
		})
		/*$.getJSON(url,function(){
      		console.log("success")
    	})
    	.fail(function() {
    		console.log( "error" );
 		 })*/
 
		/*
		var $content=$(document).find("#main-con")
		$("#main-con").html('<object data="profile"/>');*/
    });
})