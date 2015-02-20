frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/log.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/linked_phr_updates.js" %}

var PatientDashboard = inherit(RenderFormFields, {
	init: function(wrapper,cmd, entityid){
		this.wrapper = wrapper;
		this.args=cmd
		this.entityid=sessionStorage.getItem("cid")
		$(this.wrapper).empty()
		$('.field-area').empty()
		RenderFormFields.prototype.init(this.wrapper,this.args,this.entityid)
		this.render_validations(this.entityid)
		this.render_field(this.entityid)
		this.get_linked_phrs(this.entityid)
		this.get_enabled_notification(this.entityid)
		this.get_enabled_dashboard(this.entityid)
	},
	render_validations:function(profile_id){
		$('.chk').bind('click',function(event){
			var $id=$('.tab-pane.active').attr('id')
			if ($id=='dashboard'){
				if (($('#dashboard.tab-pane.active form').find("input:checkbox:checked").length)>4){
					alert("You Need to select any Four")
					$(this).prop('checked', false);
				}
			}
		})
		$('.tab-pane.active form input[required],.tab-pane.active form textarea[required],.tab-pane.active form select[required]').bind('change', function() { 
   			if (!$(this).val()){
   				$(this).css({"border": "1px solid #999","border-color": "red" });
   			}
   			else{
   				$(this).css({"border": "1px solid #999","border-color": "F3F2F5" });	
   			}
		});
		$('.tab-pane.active form input[name="mobile"]').bind('change', function() { 
			if (validate_mobile($(this).val())) {
				$(this).closest('.control-input').find('#valid').html('Valid');
		       	$(this).closest('.control-input').find('#valid').css('color', 'green');
			}
			else {
				
				$(this).closest('.control-input').find('#valid').html('Invalid');
    		    $(this).closest('.control-input').find('#valid').css('color', 'red');
  			}
		});
		$('.tab-pane.active form input[name="height"]').bind('change', function() { 
			var inches=$(this).val()/2.54
			console.log(inches)
			$(".tab-pane.active form input[name='height_in_inches']").val(inches.toFixed(2))
			
		});
		$('.tab-pane.active form input[name="weight"]').bind('change', function() { 
			var pounds=$(this).val()/0.45359237
			console.log(pounds)
			$(".tab-pane.active form input[name='weight_in_pounds']").val(pounds.toFixed(2))
			
		});
		$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
  			attr=$(e.target).attr('href')
			if (attr=='#notification' && (sessionStorage.getItem("cid")!=sessionStorage.getItem("pid"))){
				$($('input[name="linked_phr"]').parents()[3]).css("display", "none");  				
  			}
		})
		if (sessionStorage.getItem("cid")!=sessionStorage.getItem("pid")){
			$($('a[aria-controls="manage_phr"]').parent()).css("display", "none");
			$($('#manage_phr')).css("display", "none");
			$($('a[aria-controls="password"]').parent()).css("display", "none");
			$($('#password')).css("display", "none");	
		}
		if (sessionStorage.getItem("cid")==sessionStorage.getItem("pid")){
			$($('input[name="relationship"]').parents()[3]).css("display", "none");  				
  		}

	},
	render_field: function(profile_id){
		var me = this;
		$('.fileinput').fileinput()
				
		$('.save_controller').bind('click',function(event) {
			var validated=me.validate_form()	
			NProgress.start();
			if (validated==true){
				var $id=$('.tab-pane.active').attr('id')
				if ($id=='dashboard'){
					if (($('#dashboard.tab-pane.active form').find("input:checkbox:checked").length)!=4){
						alert("You Need to select any Four")
						$("input:checkbox:checked").prop('checked', false);
						return false
					}
				}	
				me.res = {};
				selected=[]
				var $id=$('.tab-pane.active').attr('id')
				$(".tab-pane.active form input, .tab-pane.active form textarea, .tab-pane.active form select").each(function(i, obj) {
					me.res[obj.name] = $(obj).val();	 
				})
				$(".tab-pane.active form").find(".chk:checked").each(function() {
					selected.push($(this).val());
  				});	
				me.res["entityid"]=profile_id
				me.res["received_from"]="Desktop"
				me.get_method(me.res,$id,me,selected)
			}
			else{
				NProgress.done();
				//frappe.msgprint("Fields Marked as Red Are Mandatory")
				return false
			}		
		})
		var files = [];
 		object = {};
 		$("input[type=file]").change(function(event) {
 			$.each(event.target.files, function(index, file) {
				var reader = new FileReader();
    			reader.onload = function(event) {  
      				object.filename = file.name;
      				object.data = event.target.result;
      				files.push(object);
    			};  
    			reader.readAsDataURL(file);
    			//me.upload_image(me.object,files)
    			
  			});
  		});
		$('.upload').bind('click',function(){
			NProgress.start();
			me.upload_image(object,profile_id)
			
  		})
  		me.get_user_image(profile_id)
  		//var image=frappe.get_cookie("user_image")
  		
  	},
  	get_states:function(){
  		frappe.call({
			method:"phr.templates.pages.profile.get_states",
			callback:function(r){
			if(r.message){
				$.each(r.message,function(i, val){
					$option=$('<option>', { 
						'value': val[0],
						'text' : val[0] 
					}).appendTo($('select[name="state"]'))
					
				})
			}
			else{
					
				}
			}
		})

  	},
  	validate_form:function(){
  		var me=this;
  		var fg=true
  		$(".tab-pane.active form input[required],.tab-pane.active form textarea[required],.tab-pane.active form select[required]").each(function(i, obj) {
  			if ($(this).val()==""){
  				$(this).css({"border": "1px solid #999","border-color": "red" });
  				frappe.msgprint("Fields Marked as Red Are Mandatory")
  				fg=false
  			}
  		})
  		if($('.tab-pane.active form input[name="mobile"]').val()){
  			if (!validate_mobile($('.tab-pane.active form input[name="mobile"]').val())) {
  				frappe.msgprint("Mobile No Invalid")
  				fg=false
  			}
  		}	
  		return fg	
  		
  	},
  	get_user_image:function(profile_id){
  		frappe.call({
			method:'phr.templates.pages.profile.get_user_image',
			args:{"profile_id":profile_id},
			callback: function(r) {
				if (r.message["image"]){
					$('<img src="'+r.message["image"]+'"alt="user image"><img>').appendTo($('.fileinput-preview'))
				}
			}
		});
  		
  	},
	upload_image:function(object,profile_id){
		frappe.call({
			method:'phr.templates.pages.profile.upload_image',
			args:{"profile_id":profile_id,"data":object.data},
			callback: function(r) {
				NProgress.done();
				if(r.message) {
					frappe.msgprint(r.message);
				}
			}
		});
	},
	get_method:function(res,cmd,me,selected){
		frappe.call({
			method:'phr.templates.pages.profile.update_profile',
			args:{'data': res,"id":cmd,"dashboard":selected},
			callback: function(r) {
				NProgress.done();
				if(r.message) {
					frappe.msgprint(r.message);
					email_msg='Linked PHR Has Updated His Profile'
					text_msg='Linked PHR Has Updated His Profile'
					send_linkedphr_updates(email_msg,text_msg,"Profile")
				}
			}
		})
	},
	get_linked_phrs:function(profile_id){
		var me=this;
		frappe.call({
			method:'phr.templates.pages.profile.get_linked_phrs',
			args:{'profile_id':profile_id},
			callback: function(r) {
				if(r.message) {
					me.render_phrs(r.message)
					
				}
			}
		})
	},
	render_phrs:function(data,profile_id){
		var me=this;
		var $wrapper=$('#manage_phr').find('form')		
		meta=JSON.parse(data.actualdata)
		meta_dic={}
		$wrapper.empty();
		console.log([meta,data])
		$.each(meta,function(i,data){
			$input=$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
								<div class="col-xs-8">\
								<div class="control-input">\
									<input type="checkbox" class="chk_phr" name="%(entityid)s" value="%(entityid)s">\
									%(person_firstname)s &nbsp %(person_lastname)s\
								</div>\
							</div>\
						</div>\
				</div>', data.profile)).appendTo($wrapper)	
			meta_dic[data.profile.entityid]=data.profile
		})
		$('<div class="update" style="width:45%;display:inline-block;text-align:right;">\
				<button class="btn btn-primary">\
					Delink \
				</button>\
			</div>').appendTo($wrapper).unbind("click").click(function(){
				selected=[]
				BootstrapDialog.confirm('are you sure?', function(result){
					// alert(result)
           			if(result) {
           			 		NProgress.start();
                			$(".chk_phr:checked").each(function() {
                				selected.push($(this).val());
  							});
							me.delink_phr(meta,selected,meta_dic,profile_id,me)
            		}else {
                			
            		}
        		});
				
			})
	},
	delink_phr:function(meta,selected,meta_dic,profile_id,me){
		var me=this;
		frappe.call({
			method:'phr.templates.pages.profile.delink_phr',
			args:{'selected':selected,"data":meta_dic,"profile_id":profile_id},
			callback: function(r) {
				NProgress.done();
				if (r.message){
					me.render_phrs(r.message["res"],profile_id)
				}
				
				//me.get_linked_phrs(r.message)
			}
		})
	},
	get_enabled_notification:function(profile_id){
		var me=this;
		frappe.call({
			method:'phr.templates.pages.profile.get_enabled_notification',
			args:{'profile_id':profile_id},
			callback: function(r) {
				if (r.message){
					me.render_notifications(r.message)
				}
				
			}
		})
	},
	render_notifications:function(data){
		var me=this;
		var $wrapper=$("#notification").find("form");		
		//meta=JSON.parse(data);
		meta_dic={};
		$('#notification.tab-pane form').find("input:checkbox:checked").prop('checked', false);
		if(data[0].linked_phr==1){
			$('input[type="checkbox"][name="linked_phr"]').prop('checked', true);		
		}
		if(data[0].to_do==1){
			$('input[type="checkbox"][name="to_do"]').prop('checked', true);		
		}
	},
	get_enabled_dashboard:function(profile_id){
		var me=this;
		frappe.call({
			method:'phr.templates.pages.profile.get_enabled_dashboard',
			args:{'profile_id':profile_id},
			callback: function(r) {
				if(r.message) {
					me.render_dashboard_values(r.message[0])
				}
			}
		})
	},
	render_dashboard_values:function(data){
		var me=this;
		var $wrapper=$("#dashboard").find("form");		
		meta_dic={};
		$('#dashboard.tab-pane form').find("input:checkbox:checked").prop('checked', false);
		if(data["medications"]==1){
			$('input[type="checkbox"][name="medications"]').prop('checked', true);		
		}
		if(data["events"]==1){
			$('input[type="checkbox"][name="events"]').prop('checked', true);		
		}
		if(data["visits"]==1){
			$('input[type="checkbox"][name="visits"]').prop('checked', true);		
		}
		if(data["appointments"]==1){
			$('input[type="checkbox"][name="appointments"]').prop('checked', true);		
		}
		if(data["disease_monitoring"]==1){
			$('input[type="checkbox"][name="disease_monitoring"]').prop('checked', true);		
		}
		if(data["messages"]==1){
			$('input[type="checkbox"][name="messages"]').prop('checked', true);		
		}
	}
})
