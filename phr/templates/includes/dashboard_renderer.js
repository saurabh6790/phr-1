frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}


function render_dashboard(profile_id){
	function render_providers(profile_id){
		frappe.call({
			method:'phr.templates.pages.provider.get_provider_List',
			args:{'profile_id':profile_id},
			callback: function(r) {
				if(r.message) {
					render_provider(r.message)
				}
				else{
					$('#hps').empty()
					$('<p class="hp">No Providers</p>').appendTo('#hps')
					
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
				else{
					$('#clphr').empty()
					$('<p class="nophr">No Linked PHRs</p>').appendTo('#clphr')  
					
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
					render_ed(r.message)
				}
			}
		})
		
	}
	function render_to_do(profile_id){
		frappe.call({
			method:'phr.templates.pages.todo.get_todo',
			args:{'profile_id':profile_id},
			callback: function(r) {
				if(r.message) {
					render_td(r.message)
				}
			}
		})
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
					else{
						$('.field-area').empty()
						$('<div>Your Dashboard is not configured,configure it now!!<br>Goto \' Profile\' >> \' Manage Dashboard \',choose any four options.</div>').appendTo('.field-area')
					}
					
				}
				else{
					$('.field-area').empty()
					$('<div>Your Dashboard is not configured,configure it now!!<br>Goto \' Profile\' >> \' Manage Dashboard \',choose any four options.</div>').appendTo('.field-area')
				}
			}
		})

	}
	function render_advertisements(profile_id){
		frappe.call({
			method:'phr.templates.pages.profile.get_advertisements',
			args:{'profile_id':profile_id},
			callback: function(r) {
				if(r.message) {
					if (r.message["rtcode"]==1){
						render_ad(r.message['ad_list'])
					}
					else{
						$('<div>NO Data</div>').appendTo('#ad')
					}
					
				}
				else{
					$('<div>NO Data</div>').appendTo('#ad')
				}
			}
		})
			
	}	
	return {
        render_providers: render_providers,
        render_linked_phr: render_linked_phr,
        render_emer_details: render_emer_details,
        render_to_do: render_to_do,
        bind_ids: bind_ids,
        render_middle_section: render_middle_section,
        render_advertisements:render_advertisements,
        render_LPHR_name:render_LPHR_name
    }
    function render_td(todo){
    	$('#tdlst').empty()
    	$wrap=$('#tdlst')
    	$.each(todo,function(i,todo){
			pro_data={"desc": todo['description'], "todo_id": todo["name"],"date":todo["date"]}
			$(repl_str('<div class="list-group-item-side %(todo_id)s">\
				<a noherf data-name=%(todo_id)s>%(desc)s</a>\
				<p class="text-muted small">%(date)s </p>\
				</div>', pro_data)).appendTo($wrap)
		})
    }
    function render_ad(ads){
    	$('#adlst').empty()
    	$wrap=$('#adlst')
    	$.each(ads,function(i,ad){
    		pro_data={"title": ad['ad_title'], "ad_link": ad["ad_link"]}
			$(repl_str('<div class="list-group-item-side ad">\
				<a href="%(ad_link)s" target="_blank">%(title)s</a>\
				</div>', pro_data)).appendTo($wrap)
		});
    }
    function render_ed(data){
    	$wrap=$('#ed')
    	pro_data={"name": data['name'], "contact": data["contact"],"barcode":data["barcode"]}
		$(repl_str('<div>Name:%(name)s<br>Contact:%(contact)s<br>\
    	<img src="%(barcode)s"></div>',pro_data)).appendTo($wrap)
  	}
    function render_lphr(data){
    	$('#clphr').find('p.nophr').remove()
		$('#clphr').empty()
		$wrap=$('#clphr')
		meta= data['list']
		meta_dic={}
		sessionStorage.setItem("lphrs",data["list_size"])
		$.each(meta,function(i,data){
			$(repl_str('<a class="list-group-item-side v_lphr %(entityid)s" data-name=%(entityid)s>\
			%(person_firstname)s</a>\
			</div>', data)).appendTo($wrap)
		})
		$(".v_lphr").unbind("click").click(function(){
			var name=$(this).html()
			sessionStorage.setItem("cname",name)
			render_LPHR_name()
			sessionStorage.setItem("cid",$(this).attr('data-name'))
			$('.field-area').empty()
			$('#main-con').empty()
			$('.breadcrumb').empty()
			$('.new_controller').hide()
			$('.save_controller').hide()
			render_providers($(this).attr('data-name'))
			$('#linkedphr').hide()
			render_middle_section($(this).attr('data-name'))
			$('#profile').attr('data-name',$(this).attr('data-name'))
		})
	
    }
    function render_LPHR_name(){
    	$('.linked-phr').empty()
    	name=sessionStorage.getItem('cname')
    	$('<a nohref class="list-group-item-side chome"><div><i class="icon-home"></i>'+name+'&nbsp</div></a>').appendTo('.linked-phr').unbind("click").click(function(){
			$('.field-area').empty()
			$('#main-con').empty()
			$('.breadcrumb').empty()
			$('.new_controller').hide()
			$('.save_controller').hide()
			render_providers(sessionStorage.getItem('cid'))
			$('#linkedphr').hide()
			render_middle_section(sessionStorage.getItem('cid'))
		})
    }
    function render_provider(data){
    	$('#hps').find('p.nohp').remove()
		$wrap=$('#hps')
		$('#hps').empty()
		meta=data
		$.each(meta,function(i,data){
			var sal=""
			if (data['provider_type']=='Doctor') sal="Dr."
			data['sal']=sal
			$(repl_str('<div class="list-group-item-side %(entityid)s">\
			<a noherf data-name=%(provider)s onclick="Provider.prototype.open_record(\'%(provider)s\')">%(sal)s %(name1)s </a>\
			</div>', data)).appendTo($wrap)
		})
    }
    function render_middle(data,profile_id){
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
    			$.each(data[0]["options"],function(i, val){
					$option=$('<option>', { 
						'value': val["id"],
						'text' : val["option"] 
					}).appendTo($('.disease'))
				})
				//onsole.log(["dm",data[0]["options"][0]['id']])
				opt=data[0]['options'][0]
				get_dm_details(profile_id,opt["id"],opt["option"])
			/*$($('#field-area').find('select')).unbind('change').change(function(){
				alert("hi")
			})*/
    	}
    	$('<div class="row"><div class="col-md-6" style="height:250px">\
                  <div class="panel panel-primary">\
                    <div class="panel-heading he1"></div>\
                      <div class="panel-body" style="padding:1px;height:200px;overflow:hidden;overflow:auto">\
                        <table data-toggle="table" class="table table-striped" data-url="fields" style="padding=0px;" id="table1">\
                        	<thead></thead>\
						<tbody id="t1"></tbody>\
                        </table>\
                      </div>\
                  </div>\
                  <div class="panel panel-primary">\
                    <div class="panel-heading he2"></div>\
                      <div class="panel-body" style="padding:1px;height:200px;overflow:hidden;overflow:auto">\
                        <table class="table table-striped" style="padding=0px;" id="table2">\
                        <thead><tr></tr></thead>\
						<tbody></tbody>\
                        </table>\
                      </div>\
                  </div></div>\
            <div class="col-md-6" style="height:250px " >\
                <div class="panel panel-primary">\
                    <div class="panel-heading he3"></div>\
                    <div class="panel-body" style="padding:1px;height:200px;overflow:hidden;overflow:auto">\
                     <table class="table table-striped" style="padding=0px;width=100%" id="table3">\
                       <thead><tr></tr></thead>\
                       	<tbody></tbody>\
                    </table>\
                  </div>\
                </div> \
                <div class="panel panel-primary">\
                    <div class="panel-heading he4"></div>\
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
		$('<strong>').html(data["label"]).appendTo(".he1").css('color',' #ffffff')
		//alert(data['rows'])
		if (data["fieldname"]!='disease_monitoring'){
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
    function render_table2(data){
		$('<strong>').html(data["label"]).appendTo(".he2").css('color',' #ffffff')
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
		$('<strong>').html(data["label"]).appendTo(".he3").css('color',' #ffffff')
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
    	$('<strong>').html(data["label"]).appendTo(".he4").css('color',' #ffffff')
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
    	$("#table1 tr").remove()
    	$.each(data['rows'],function(i, val){
    		if (i==0){
    			var r = $("<tr>").appendTo($("#table1").find("thead"));
    			$.each(val,function(i, d){
    				if (i!=0){
    					$("<th>").html(d)
							.appendTo(r);
					}
				})
			} 
			else{
				var row = $("<tr>").appendTo($("#table1").find("tbody"));
				$.each(val,function(i, d){
					if (i!=0){
		 			 $("<td>").html(d)
				 		.appendTo(row); 
				 	}
				})
			}
		})
    }
}

