frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/log.js" %}
{% include "templates/includes/form_generator.js" %}

var PatientDashboard = inherit(RenderFormFields, {
	init: function(wrapper,cmd, entityid){
		this.wrapper = wrapper;
		this.args=cmd
		this.entityid=sessionStorage.getItem("cid")
		$(this.wrapper).empty()
		$('.field-area').empty()
		RenderFormFields.prototype.init(this.wrapper,this.args,this.entityid)
		this.render_field(this.entityid)
		this.get_linked_phrs(this.entityid)
		this.get_enabled_notification(this.entityid)
		this.get_enabled_dashboard(this.entityid)
	},
	render_field: function(profile_id){
		var me = this;
		$('.fileinput').fileinput()
		$('.chk').bind('click',function(event){
			var $id=$('.tab-pane.active').attr('id')
			if ($id=='dashboard'){
				if (($('#dashboard.tab-pane.active form').find("input:checkbox:checked").length)>4){
					alert("You Need to select any Four")
					/*$("input:checkbox:checked").prop('checked', false);*/
		
					$(this).prop('checked', false);
				}
			}
		})
		$('.save_controller').bind('click',function(event) {
			NProgress.start();
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
			me.upload_image(object,profile_id)
  		})
  		me.get_user_image(profile_id)
  		//var image=frappe.get_cookie("user_image")
  		
  	},
  	get_user_image:function(profile_id){
  		frappe.call({
			method:'phr.templates.pages.profile.get_user_image',
			args:{"profile_id":profile_id},
			callback: function(r) {
				console.log(r)
				$('<img src="'+r.message["image"]+'"alt="user image"><img>').appendTo($('.fileinput-preview'))
			}
		});
  		
  	},
	upload_image:function(object,profile_id){
		alert(profile_id)
		frappe.call({
			method:'phr.templates.pages.profile.upload_image',
			args:{"profile_id":profile_id,"data":object.data},
			callback: function(r) {
				console.log(r)
				if(r.message) {
					$("input").val("");
					var dialog = frappe.msgprint(r.message);
				}
			}
		});
	},
	get_method:function(res,cmd,me,selected){
		frappe.call({
			method:'phr.templates.pages.profile.update_profile',
			args:{'data': res,"id":cmd,"dashboard":selected},
			callback: function(r) {
				console.log(r)
				NProgress.done();
				if(r.message) {
					$("input").val("");
					var dialog = frappe.msgprint(r.message);
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
					me.render_phrs(r.message,profile_id)
				}
			}
		})
	},
	render_phrs:function(data,profile_id){
		var me=this
		var $wrapper=$('#manage_phr').find('form')		
		meta=JSON.parse(data.actualdata)
		meta_dic={}
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
			</div>').appendTo($wrapper).click(function(){
				selected=[]
				BootstrapDialog.confirm('are you sure?', function(result){
           			 if(result) {
                		$(".chk_phr:checked").each(function() {
                			console.log($(this).val())
							selected.push($(this).val());
  						});
						me.delink_phr(meta,selected,meta_dic,profile_id,me)
            		}else {
                			
            		}
        		});
				
			})
	},
	delink_phr:function(meta,selected,meta_dic,profile_id,me){
		//var me=this;
		frappe.call({
			method:'phr.templates.pages.profile.delink_phr',
			args:{'selected':selected,"data":meta_dic,"profile_id":profile_id},
			callback: function(r) {
				me.get_linked_phrs(r.message)
			}
		})
	},
	get_enabled_notification:function(profile_id){
		console.log(["hiiii",profile_id])
		var me=this;
		frappe.call({
			method:'phr.templates.pages.profile.get_enabled_notification',
			args:{'profile_id':profile_id},
			callback: function(r) {
				console.log(r.message)
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
		console.log(data[0].to_do)
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
		//meta=JSON.parse(data);
		meta_dic={};
		console.log(data)
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
		/*if(data["to_do"==1){
			$('input[type="checkbox"][name="to_do"]').prop('checked', true);		
		}*/

	}
})
