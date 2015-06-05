frappe.provide("templates/includes");

{% include "templates/includes/linked_phr_updates.js" %}
{% include "templates/includes/html_viewer.js" %}


var ProfileSettings = inherit(RenderFormFields, {
	init: function(wrapper,cmd, entityid){
		this.wrapper = wrapper;
		this.args=cmd
		this.entityid=sessionStorage.getItem("cid")
		$(this.wrapper).empty()
		$('.field-area').empty()
		$('#share').remove()
		RenderFormFields.prototype.init(this.wrapper,this.args,this.entityid)
		this.render_validations(this.entityid)
		this.render_field(this.entityid)
		//this.get_linked_phrs(this.entityid)
		this.get_enabled_notification(this.entityid)
		this.get_enabled_dashboard(this.entityid)
		//this.download_phr(this.entityid)
	},
	download_phr:function(profile_id){
		
	},
	render_validations:function(profile_id){
		$('#share').remove()

		var me=this;
		
		$('.chk').bind('click',function(event){
			var $id=$('.tab-pane.active').attr('id')
			// console.log($('.tab-pane.active').attr('id'))
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
		$('a[data-toggle="tab"]').on('click', function (e) {
  			attr=$(e.target).attr('href')
  			$('.save_controller').show();
			if (attr=='#notification' && (sessionStorage.getItem("cid")!=sessionStorage.getItem("pid"))){
				$($('input[name="linked_phr"]').parents()[3]).css("display", "none");  				
  			}
  			else if(attr=='#manage_phr'){
  				$('.save_controller').hide();
  				me.get_linked_phrs(sessionStorage.getItem('pid'))
  			}
		})
		if (sessionStorage.getItem("cid")!=sessionStorage.getItem("pid")){
			$('.tab-pane.active').removeClass('active');
			$($('a[aria-controls="manage_phr"]').parent()).css("display", "none");
			$($('#manage_phr')).css("display", "none");
			$($('a[aria-controls="password"]').parent()).css("display", "none");
			$($('#password')).css("display", "none");
			$($('a[aria-controls="notification"]').parent()).css("display", "none");
			$($('#notification')).css("display", "none");
			$($('a[aria-controls="dashboard"]').parent()).addClass('active')
			$($('#dashboard')).addClass('active');

		}
		if (sessionStorage.getItem("cid")==sessionStorage.getItem("pid")){
			$($('input[name="relationship"]').parents()[3]).css("display", "none");
			if ($('input[name="email"]').val()){
				$('input[name="email"]').prop('disabled',true)
			}
			//me.verify_mobile()  				
  		}
  		

	},
	verify_mobile:function(profile_id){
		//<i class="icon-ok"></i>
		/*frappe.call({
			method:"phr.templates.pages.profile.verify_mobile",
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
		})*/

	},
	render_field: function(profile_id){
		var me = this;
		// $('.fileinput').fileinput()
				
		$('.save_controller').bind('click',function(event) {
			var validated=me.validate_form()	
			NProgress.start();
			if (validated['fg']==true){
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
				frappe.msgprint(validated["msg"])
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
  		//me.get_user_image(profile_id)
  		//var image=frappe.get_cookie("user_image")
  		
  	},
  	validate_form:function(){
  		var me=this;
  		var fg=true
  		msg=""
  		$(".tab-pane.active form input[required],.tab-pane.active form textarea[required],.tab-pane.active form select[required]").each(function(i, obj) {
  			if ($(this).val()==""){
  				$(this).css({"border": "1px solid #999","border-color": "red" });
  				fg=false
  			}
  		})
  		if (fg==false){
  			return {
  				"fg":fg,
  				"msg":"Fields Marked as Red Are Mandatory"
  			}
 		}
  		if($('.tab-pane.active form input[name="mobile"]').val()){
  			if (!validate_mobile($('.tab-pane.active form input[name="mobile"]').val())) {
  				msg="Mobile No Invalid"
  				fg=false
  			}
  		}
  		return {
  			"fg":fg,
  			"msg":msg
  		}	
  	},
	get_method:function(res,cmd,me,selected){
		frappe.call({
			method:'phr.templates.pages.profile.update_profile',
			args:{'data': res,"id":cmd,"dashboard":selected},
			callback: function(r) {
				NProgress.done();
				if(r.message) {
					frappe.msgprint(r.message);
					$('#share').remove();
					email_msg='Linked PHR Has Updated His Profile';
					text_msg='Linked PHR Has Updated His Profile';
					send_linkedphr_updates(email_msg,text_msg,"Profile");
				}
			}
		})
	},
	get_linked_phrs:function(profile_id){
		var me=this;
		frappe.call({
			method:'phr.templates.pages.dashboard.get_linked_phrs',
			args:{'profile_id':profile_id},
			callback: function(r) {
				if(r.message) {
					// console.log(['get linked phr', r.message])
					me.render_phrs(r.message,profile_id)
				}
				else{
					// console.log(["if non linked phr"])
					var $wrapper=$('#manage_phr').find('form')
					$wrapper.empty();
					$input=$('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
								<div class="col-xs-8">\
								<div class="control-input">\
									No linked PHRs\
								</div>\
							</div>\
						</div>\
				</div>').appendTo($wrapper)	
				}
			}
		})
	},
	render_phrs:function(data,profile_id){
		var me=this;
		var $wrapper=$('#manage_phr').find('form')		
		meta = data['list']
		// console.log(data)
		this.meta_dic={}
		$wrapper.empty();
		// console.log(['Render PHRs', meta, data])
		$.each(meta,function(i,data){
			$input=$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
								<div class="col-xs-8">\
								<div class="control-input">\
									<input type="radio" class="chk_phr" name="lnkd_phr" value="%(entityid)s">\
									%(person_firstname)s &nbsp %(person_lastname)s\
								</div>\
							</div>\
						</div>\
				</div>', data)).appendTo($wrapper)	
			me.meta_dic[data.entityid]=data
			// console.log(['meta rendering', me.meta_dic])
		})
		$('<div class="update" style="width:45%;display:inline-block;text-align:right;">\
				<button class="btn btn-primary">\
					Delink \
				</button>\
			</div>').appendTo($wrapper).unbind("click").click(function(){
				selected=[]
				if ($('.chk_phr:checked').length>0){
					BootstrapDialog.confirm('Are You Sure?', function(result){
						if(result) {
							// console.log(['sure meta dict', me.meta_dic])
							me.delink_phr(meta,$('.chk_phr:checked').val(),me.meta_dic,profile_id,me)
	            		}
	        		});					
				}
				else{
					frappe.msgprint("Please Select record from the list to Delink")
				}
			})
	},
	delink_phr:function(meta,selected,meta_dic,profile_id,me){
	fields=[{
   				"fieldname": "email", 
				"fieldtype": "data", 
   				"label": "Email", 
   				"placeholder": "", 
   				"required": 1,
   				"description": "All your future notifications will be sent on these Email"
  			}, 
  			{
   				"fieldname": "mobile", 
   				"fieldtype": "data", 
   				"label": "Mobile", 
   				"placeholder": "", 
   				"required": 1,
   				"description": "All your future notifications will be sent on these Mobile"
  			}] 
		d = new Dialog();
		d.init({'fields':fields,"values":meta_dic[selected],"title":"Add Email And Mobile"})
		d.show()
		var me=this;
		res={}
		$('.modal-footer .btn-primary').click(function(){
			$(".modal-body .form-column input").each(function(i, obj) {
				res[obj.name] = $(obj).val();
			})
			if (validate_mobile(res['mobile']) && validate_email(res['email'])) {
				frappe.call({
					method:'phr.templates.pages.profile.check_existing',
					args:{'email':res['email'],"mobile":res["mobile"]},
					callback: function(r) {
						// console.log(r)
						if (r.message){
							frappe.msgprint(r.message.msg)
						}
						else{
							// console.log(['delink_phr', meta_dic])
							me.delink_profile(meta,selected,meta_dic,profile_id,me,res)
							var $modal = $("#myModal").detach().modal();
							 $modal.modal("hide");
							 $modal.modal("destroy").remove();
						}

					}
				})
			}
			else{
				frappe.msgprint('Email or Mobile Number is not valid')
			}
		})
	},
	delink_profile:function(meta,selected,meta_dic,profile_id,me,res){
		//console.log([meta,selected,meta_dic,profile_id,me,res])
		frappe.call({
				method:'phr.templates.pages.profile.delink_phr',
				args:{'selected':selected,"data":meta_dic,"profile_id":profile_id,"res":res},
				callback: function(r) {
					if (r.message['response']['returncode']==121){
						frappe.msgprint(r.message['message'])
						me.get_linked_phrs(profile_id)
						var db = new render_dashboard();
						db.render_linked_phr(sessionStorage.getItem("pid"))
						me.add_profile_to_db(r.message['response'],profile_id)
					}
				}
			})
	},
	add_profile_to_db:function(data,profile_id){
		frappe.call({
				method:'phr.templates.pages.profile.add_profile_to_db',
				args:{"data":data,"profile_id":profile_id},
				callback: function(r) {
					NProgress.done();
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
			method:'phr.templates.pages.dashboard.get_enabled_dashboard',
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