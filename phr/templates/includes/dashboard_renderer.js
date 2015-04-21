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
    	class_mapper={"High":"danger","Medium":"warning","Low":"info"}
    	$('#tdlst').empty()
    	$wrap=$('#tdlst')
    	$.each(todo,function(i,todo){
			pro_data={"desc": todo['desc'], "todo_id": todo["name"],"date":todo["date"],"tdclass":class_mapper[todo["priority"]]}
			
			$(repl_str('<li class="timeline-item %(tdclass)s">\
                <div class="margin-left-15">\
                    <div class="text-muted text-small">%(date)s</div>\
                    <p>%(desc)s</p>\
                </div></li>', pro_data)).appendTo($wrap)
		})
    }
    function render_ad(ads){
    	$('#adlst').empty()
    	$wrap=$('#adlst')
    	$.each(ads,function(i,ad){
    		pro_data={"title": ad['ad_title'], "ad_link": ad["ad_link"]}
			    		
			$(repl_str('<li><a href="%(ad_link)s" target="_blank">%(title)s</a>\
            </li>', pro_data)).appendTo($wrap)
		});
    }
    function render_ed(data){
    	$wrap=$('#ed')
    	pro_data={"name": data['name'], "contact": data["contact"],"barcode":data["barcode"],"emer_con":data['emergency_contact'],"blood_group":data['blood_group']}
    	sessionStorage.setItem("barcode",pro_data["barcode"])
    	$(repl_str('<p><span class="light">Name:</span> <span class="green">%(name)s</span></p>\
    		<p><span class="light">Contact:</span> <span class="green">%(contact)s</span></p>\
    		<p><span class="light">Emergency Contact:</span> <span class="green">%(emer_con)s</span></p>\
    		<p><span class="light">Blood Group:</span> <span class="green">%(blood_group)s</span></p>\
    		<p><span class="light"><img src="%(barcode)s"></span></p>',pro_data)).appendTo($wrap)
  	}
    function render_lphr(data){
    	$('#clphr').find('p.nophr').remove()
		$('#clphr').empty()
		$wrap=$('#clphr')
		meta= data['list']
		meta_dic={}
		sessionStorage.setItem("lphrs",data["list_size"])
		$.each(meta,function(i,data){
			$(repl_str('<li><a nohref class="v_lphr %(entityid)s" data-name=%(entityid)s>\
				<div class="item-content"><div class="item-media"></div>\
				<div class="item-inner"><span class="title cn">%(person_firstname)s %(person_lastname)s</span></div>\
				</div></a></li>',data)).appendTo($wrap)
			/*$(repl_str('<a class="list-group-item-side v_lphr %(entityid)s" data-name=%(entityid)s>\
			%(person_firstname)s %(person_lastname)s</a>\
			</div>', data)).appendTo($wrap)*/
		})
		$(".v_lphr").unbind("click").click(function(){
			var name=$(this).find('.cn').html()
			sessionStorage.setItem("cname",name)
			sessionStorage.setItem("cid",$(this).attr('data-name'))
			render_LPHR_name()
			$('.field-area').empty()
			$('#main-con').empty()
			$('.breadcrumb').empty()
			$('.new_controller').hide()
			$('.save_controller').hide()
			$('.link-phr').empty()
			render_providers($(this).attr('data-name'))
			$('#linkedphr').hide()
			render_middle_section($(this).attr('data-name'))
			$('#profile').attr('data-name',$(this).attr('data-name'))
		})
	
    }
    function render_LPHR_name(){
    	//if $( "#mydiv" ).hasClass( "foo" )
    	$('.cdd').removeClass('hide')
    	$('#cphrname').empty()
    	$('#cimage').empty()
    	name=sessionStorage.getItem('cname')
    	$('.cdd .linked-phr #cphrname').append(name)
    	frappe.call({
			method:'phr.templates.pages.profile.get_user_image',
			args:{"profile_id":sessionStorage.getItem("cid")},
			callback: function(r) {
				if (r.message["image"]){
					//$('.cdd .linked-phr #cphrimg').attr("src",r.message["image"])
					$('<img style="min-width: 40px; max-height: 30px; border-radius: 4px" src="'+r.message["image"]+'" class="img-rounded"  id="cphrimg" title="'+name+'" alt="'+name+'">').appendTo($('.cdd .linked-phr #cimage'))
				}
			}
		});


    	/*$('<a nohref class="chome"><div class="item-inner"><i class="icon-home"></i>'+name+'&nbsp</div></a>').appendTo('.linked-phr').unbind("click").click(function(){
			$('.field-area').empty()
			$('#main-con').empty()
			$('.breadcrumb').empty()
			$('.new_controller').hide()
			$('.save_controller').hide()
			render_providers(sessionStorage.getItem('cid'))
			$('#linkedphr').hide()
			render_middle_section(sessionStorage.getItem('cid'))
		})*/
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
			$(repl_str('<li><a nohref data-name=%(provider)s onclick="Provider.prototype.open_record(\'%(provider)s\')">\
				<div class="item-content"><div class="item-media"></div>\
				<div class="item-inner"><span class="title">%(name1)s</span></div>\
				</div></a></li>', data)).appendTo($wrap)
			/*$(repl_str('<a noherf data-name=%(provider)s onclick="Provider.prototype.open_record(\'%(provider)s\')"><div class="item-inner">%(name1)s</div></a>', data)).appendTo($wrap)*/
		})
    }
    function render_middle(data,profile_id){
    	img_mapper={
    			"events":"assets/phr/images/events.png",
    			"visits":"assets/phr/images/visits.png",
    			"medications":"assets/phr/images/medications.png",
    			"disease_monitoring":"assets/phr/images/disease-monitoring.png",
    			"appointments":"assets/phr/images/appointments.png",
    			"messages":"assets/phr/images/message.png"
    		}
    	$('<div class="panel panel-white no-radius disease_monitorg events"><div class="panel-heading border-light he1"></div>\
    		<div class="panel-body no-padding" ><div class="table-responsive">\
    		<table id="table1" class="table table-bordered table-hover">\
    		<thead></thead><tbody></tbody></table>\
    		</div></div></div><div class="panel panel-white no-radius disease_monitorg events">\
    		<div class="panel-heading border-light he2"></div><div class="panel-body no-padding" >\
    		<div class="table-responsive"><table id="table2" class="table table-bordered table-hover"><thead></thead><tbody></tbody></table></div></div></div>\
    		<div class="panel panel-white no-radius disease_monitorg events"><div class="panel-heading border-light he3"></div><div class="panel-body no-padding" ><div class="table-responsive"><table id="table3" class="table table-bordered table-hover"><thead></thead><tbody></tbody></table></div></div></div><div class="panel panel-white no-radius disease_monitorg events"><div class="panel-heading border-light he4"></div><div class="panel-body no-padding" >\
    		<div class="table-responsive">\
    		<table id="table4" class="table table-bordered table-hover"><thead></thead><tbody></tbody></table></div></div></div>').appendTo($('#main-con'))
		
		if (data[0]["fieldname"]=='disease_monitoring'){
			$('<div class="col-md-6"><h4 class="panel-title">\
				<img src="assets/phr/images/disease-monitoring.png" alt="Disease Monitoring" title="Disease Monitoring"> Disease Monitoring</h4>\
				</div><div class="col-md-6 wt_mngnt_main"><div class="form-group">\
				<label class="col-md-3 green text-right disease_lbl">Disease:</label>\
				<label class="col-md-9 weight_mngnt">\
				<select id="weight_mngnt_dp" style="width:100%;" class="disease" name="disease"></select>\
				</label></div>').appendTo($('.he1')).on('change',function(){
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
		render_table1(data[0],img_mapper)
		render_table2(data[1],img_mapper)
		render_table3(data[2],img_mapper)
		render_table4(data[3],img_mapper)
    }
    function render_table1(data,img_mapper){
		cols = [];
		data_row = [];
		//alert(data['rows'])
		if (data["fieldname"]!='disease_monitoring'){
			$('<h4 class="panel-title">\
				<img src="'+img_mapper[data["fieldname"]]+'" alt="'+data["fieldname"]+'" title="'+data["fieldname"]+'">'+data["label"]+'\
				</h4>').appendTo(".he1")
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
    function render_table2(data,img_mapper){
		$('<h4 class="panel-title">\
				<img src="'+img_mapper[data["fieldname"]]+'" alt="'+data["fieldname"]+'" title="'+data["fieldname"]+'">'+data["label"]+'\
				</h4>').appendTo(".he2")
		$.each(data['rows'],function(i, val){
			if (i==0){
				var r = $("<tr>").appendTo($("#table2").find("thead"));
				$.each(val,function(i, d){
					$("<th>").html(d)
					.appendTo(r);
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
    function render_table3(data,img_mapper){
		$('<h4 class="panel-title">\
				<img src="'+img_mapper[data["fieldname"]]+'" alt="'+data["fieldname"]+'" title="'+data["fieldname"]+'">'+data["label"]+'\
				</h4>').appendTo(".he3")
		$.each(data['rows'],function(i, val){
			if (i==0){
				var r = $("<tr>").appendTo($("#table3").find("thead"));
				$.each(val,function(i, d){
					$("<th>").html(d)
					.appendTo(r);
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
    function render_table4(data,img_mapper){
    	$('<h4 class="panel-title">\
				<img src="'+img_mapper[data["fieldname"]]+'" alt="'+data["fieldname"]+'" title="'+data["fieldname"]+'">'+data["label"]+'\
				</h4>').appendTo(".he4")
		$.each(data['rows'],function(i, val){
			if (i==0){
				var r = $("<tr>").appendTo($("#table4").find("thead"));
				$.each(val,function(i, d){
					$("<th>").html(d)
					.appendTo(r);
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
    		if (i<=4){
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
			}
		})
    }
}

