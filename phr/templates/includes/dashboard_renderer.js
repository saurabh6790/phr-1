frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}

function render_dashboard(profile_id){
	function render_providers(profile_id){
		frappe.call({
			method:'phr.templates.pages.provider.get_provider_List',
			args:{'profile_id':profile_id},
			callback: function(r) {
				if(r.message) {
					render_provider(r.message)
				}
			}
		})
	}
	function render_linked_phr(profile_id){
		frappe.call({
			method:'phr.templates.pages.profile.get_linked_phrs',
			args:{'profile_id':profile_id},
			callback: function(r) {
				if(r.message) {
					render_lphr(r.message)
				}
			}
		})
	
	}
	function render_emer_details(profile_id){
		frappe.call({
			method:'phr.templates.pages.profile.get_user_details',
			args:{'profile_id':profile_id},
			callback: function(r) {
				if(r.message) {
					console.log(r.message)
					render_ed(r.message)
				}
			}
		})
		
	}
	function render_to_do(profile_id){
		console.log("to_do")
	}
	function bind_ids(profile_id){
		console.log("ids")
	}
	function render_middle_section(profile_id){
		frappe.call({
			method:'phr.templates.pages.profile.get_data_for_middle_section',
			args:{'profile_id':profile_id},
			callback: function(r) {
				if(r.message) {
					if (r.message["rtcode"]==1){
						render_middle(r.message['res_list'],profile_id)
					}
					//render_lphr(r.message)
				}
			}
		})

	}
	function render_advertisements(profile_id){
		console.log("adv")	
	}	
	return {
        render_providers: render_providers,
        render_linked_phr: render_linked_phr,
        render_emer_details: render_emer_details,
        render_to_do: render_to_do,
        bind_ids: bind_ids,
        render_middle_section: render_middle_section,
        render_advertisements:render_advertisements
    }
    function render_ed(data){
    	console.log(data)
    	$wrap=$('#ed')
    	$('<div>Name:'+data["name"]+'<br>Contact:'+data["contact"]+'<br>\
    	<img src="'+data["barcode"]+'"></div>').appendTo($wrap)
/*		
    	$wrap=$('#ed')
    	$(repl_str('<div>Name:%(name)s<br>Contact:%(contact)s<br>\
    	<img src=%(barcode)s></div>'),data).appendTo($wrap)
 */   }
    function render_lphr(data){
    	$('#linkedphr').find('p.nophr').remove()
		$wrap=$('#linkedphr')
		meta=JSON.parse(data.actualdata)
		meta_dic={}
		$.each(meta,function(i,data){
			$(repl_str('<div class="list-group-item-side %(entityid)s">\
			<a noherf data-name=%(entityid)s>%(person_firstname)s </a>\
			</div>', data.profile)).appendTo($wrap)
		})
    }
    function render_provider(data){
		$('#hp').find('p.nohp').remove()
		$wrap=$('#hp')
		meta=data
		$.each(meta,function(i,data){
			$(repl_str('<div class="list-group-item-side %(entityid)s">\
			<a noherf data-name=%(provider)s>%(name1)s </a>\
			</div>', data)).appendTo($wrap)
		})
    }
    function render_middle(data,profile_id){
    	console.log(data[1])
    	if (data[0]["fieldname"]=='disease_monitoring'){
    		$('<div class="row" ><div class="col-md-6"><label class="control-label small col-xs-4" style="padding-right: 0px;">Disease</label>\
				<div class="col-xs-8">\
					<div class="control-input">\
						<select type="text" class="form-control disease" \
							name="disease">\
					</div>\
				</div></div></div>').appendTo($('.field-area')).css("padding-bottom","2%").on('change',function(){
					var txt = $(".disease option:selected").text();
					var val = $(".disease option:selected").val();
					get_dm_details(profile_id,val,txt)
				})
    			$option=$('<option>', { 
						'value': "",
						'text' : "" 
				}).appendTo($('.disease'))
				$.each(data[0]["options"],function(i, val){
					$option=$('<option>', { 
						'value': val["id"],
						'text' : val["option"] 
					}).appendTo($('.disease'))
				})
			/*$($('#field-area').find('select')).unbind('change').change(function(){
				alert("hi")
			})*/
    	}
    	$('<div class="row"><div class="col-md-6" style="height:250px">\
                  <div class="panel panel-primary">\
                    <div class="panel-heading he1"><span style="float:right"><i class="icon-remove"></i></span></div>\
                      <div class="panel-body" style="padding:1px;height:200px;overflow:hidden;overflow:auto">\
                        <table data-toggle="table" class="table table-striped" data-url="fields" style="padding=0px;" id="table1">\
                        	<thead></thead>\
						<tbody id="t1"></tbody>\
                        </table>\
                      </div>\
                  </div>\
                  <div class="panel panel-primary">\
                    <div class="panel-heading he2"><span style="float:right"><i class="icon-remove"></i></span></div>\
                      <div class="panel-body" style="padding:1px;height:200px;overflow:hidden;overflow:auto">\
                        <table class="table table-striped" style="padding=0px;" id="table2">\
                        <thead><tr></tr></thead>\
						<tbody></tbody>\
                        </table>\
                      </div>\
                  </div></div>\
            <div class="col-md-6" style="height:250px " >\
                <div class="panel panel-primary">\
                    <div class="panel-heading he3"><span style="float:right"><i class="icon-remove"></i></span></div>\
                    <div class="panel-body" style="padding:1px;height:200px;overflow:hidden;overflow:auto">\
                     <table class="table table-striped" style="padding=0px;width=100%" id="table3">\
                       <thead><tr></tr></thead>\
                       	<tbody></tbody>\
                    </table>\
                  </div>\
                </div> \
                <div class="panel panel-primary">\
                    <div class="panel-heading he4"><span style="float:right"><i class="icon-remove"></i></span></div>\
                      <div class="panel-body" style="padding:1px;height:200px;overflow:hidden;overflow:auto">\
                        <table class="table table-striped" style="padding=0px;" id="table4">\
                        <thead><tr></tr></thead>\
						<tbody></tbody>\
                        </table>\
                      </div></div>\
            </div></div>').appendTo($('#main-con'))
		render_table1(data[0],'#table1')
		render_table2(data[1],'#table2')
		render_table3(data[2],'#table3')
		render_table4(data[3],'#table4')
    }
    function render_table1(data){
		cols = [];
		data_row = [];
		$('<strong>').html(data["label"]).appendTo(".he1")
		if (data["fieldname"]!='disease_monitoring'){
			$.each(data['rows'],function(i, val){
				if (i==0){
					$.each(val,function(i, d){
						$("<th>").html(d)
						.appendTo($('#table1').find("thead tr"));
					})
				} 
				else{
					var row = $("<tr>").appendTo($("#table1").find("tbody"));
					$.each(val,function(i, d){
						 $("<td>").html(d)
						 	.appendTo(row); 
					})
				}
			})
		}
    }
    function render_table2(data){
		$('<strong>').html(data["label"]).appendTo(".he2")
		$.each(data['rows'],function(i, val){
			if (i==0){
				$.each(val,function(i, d){
					$("<th>").html(d)
					.appendTo($('#table2').find("thead tr"));
				})
			} 
			else{
				var row = $("<tr>").appendTo($("#table2").find("tbody"));
				$.each(val,function(i, d){
					 $("<td>").html(d)
					 	.appendTo(row); 
				})
			}
		})
    }
    function render_table3(data){
		$('<strong>').html(data["label"]).appendTo(".he3")
		$.each(data['rows'],function(i, val){
			if (i==0){
				$.each(val,function(i, d){
					$("<th>").html(d)
					.appendTo($('#table3').find("thead tr"));
				})
			} 
			else{
				var row = $("<tr>").appendTo($("#table3").find("tbody"));
				$.each(val,function(i, d){
				 $("<td>").html(d)
							 	.appendTo(row); 
				})
			}
		})
    }
    function render_table4(data){
		$('<strong>').html(data["label"]).appendTo(".he4")
		$.each(data['rows'],function(i, val){
			if (i==0){
				$.each(val,function(i, d){
					$("<th>").html(d)
					.appendTo($('#table4').find("thead tr"));
				})
			} 
			else{
				var row = $("<tr>").appendTo($("#table4").find("tbody"));
				$.each(val,function(i, d){
					 $("<td>").html(d)
						 	.appendTo(row); 
				})
			}
		})
    }
    function get_dm_details(profile_id,event_master_id,name){
    	frappe.call({
			method:'phr.templates.pages.disease_monitoring.render_table_on_db',
			args:{'profile_id':profile_id,"event_master_id":event_master_id,"name":name},
			callback: function(r) {
				if(r.message) {
					if (r.message["rtcode"]==1){
						render_dm_table(r.message['res_list'],profile_id)
					}
				}
			}
		})
    }
    function render_dm_table(data,profile_id){
    	console.log(data['rows'])
    	$("#table1 tr").remove()
    	$.each(data['rows'],function(i, val){
    		if (i==0){
    			var r = $("<tr>").appendTo($("#table1").find("thead"));
				$.each(val,function(i, d){
					$("<th>").html(d)
						.appendTo(r);
				})
			} 
			else{
				var row = $("<tr>").appendTo($("#table1").find("tbody"));
				$.each(val,function(i, d){
		 			 $("<td>").html(d)
				 		.appendTo(row); 
				})
			}
		})
    }
}

