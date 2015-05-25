frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/log.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/linked_phr_updates.js" %}
{% include "templates/includes/html_viewer.js" %}
{% include "templates/includes/uploader.js" %}
{% include "templates/includes/custom_dialog.js" %}


var PatientDashboard = inherit(RenderFormFields, {
	init: function(wrapper,cmd, entityid){
		this.wrapper = wrapper;
		this.args=cmd
		this.entityid=entityid ? entityid:sessionStorage.getItem("cid")
		$(this.wrapper).empty()
		$('.field-area').empty()
		// RenderFormFields.prototype.init(this.wrapper, this.args, this.entityid)

		HTMLViewer.prototype.init(this.wrapper, this.args, this.entityid)

		this.get_user_image(this.entityid)
		$('#share').remove()
		this.make_profile_noeditable(this.entityid)
		scroll_top()

	},
	make_editable_profile:function(profile_id){
		// console.log(profile_id)
		var me=this;
		RenderFormFields.prototype.init(this.wrapper, this.args, this.entityid)
		$('.edit_profile').remove()
		$('.save_controller').remove()

		$('<div class="pull-right margin-left-20 save_controller">\
			<button class="btn btn-primary"><i class="fa fa-save"></i> Save</button></div>').appendTo($('.top-btns-bar'))

		this.render_validations(this.entityid)
		this.render_field(this.entityid)
		MobileVerifier.prototype.check_contact_verified($('input[name="mobile"]').val())

		$('#share').remove()
		$("form input,form textarea,form select").each(function(i, obj) {
			$(this).prop('disabled', false);
		})
		if ($('input[name="email"]').val()){
			$('input[name="email"]').prop('disabled',true)
		}
		$('input[name="height_in_inches"]').prop('disabled',true)
		$('input[name="weight_in_pounds"]').prop('disabled',true)
		// me.render_field(sessionStorage.getItem('cid'))
	},
	make_profile_noeditable:function(){
		var me=this;
		$('.save_controller').remove()
		$('<div class="pull-right margin-left-20 edit_profile">\
			<button class="btn btn-primary"><i class="fa fa-pencil-square-o"></i> Edit</button></div>').appendTo($('.top-btns-bar')).on("click",function(){
				me.make_editable_profile()
		})
		$("form input,form textarea,form select").each(function(i, obj) {
			$(this).prop('disabled', true);
		})
	},
	render_validations:function(profile_id){
		// console.log("testing validations")
		var me=this;
		$('form input[required], form textarea[required], form select[required]').bind('change', function() { 
   			if (!$(this).val()){
   				$(this).css({"border": "1px solid #999","border-color": "red" });
   			}
   			else{
   				$(this).css({"border": "1px solid #999","border-color": "F3F2F5" });	
   			}
		});
		$('form input[name="mobile"]').bind('change', function() { 
			if (validate_mobile($(this).val())) {
				$(this).closest('.control-input').find('#valid').html('Valid');
		       	$(this).closest('.control-input').find('#valid').css('color', 'green');
			}
			else {
				
				$(this).closest('.control-input').find('#valid').html('Invalid');
    		    $(this).closest('.control-input').find('#valid').css('color', 'red');
  			}
		});
		$('form input[name="email"]').bind('change', function() {
			console.log(this) 
			if (validate_email($(this).val())) {
				$(this).closest('.control-input').find('#valid').html('Valid');
		       	$(this).closest('.control-input').find('#valid').css('color', 'green');
			}
			else {
				
				$(this).closest('.control-input').find('#valid').html('Invalid');
    		    $(this).closest('.control-input').find('#valid').css('color', 'red');
  			}
		});	
		$('form input[name="height"]').bind('change', function() { 
			var inches=$(this).val()/2.54
			//var prod = one / 0.0254 / 100;
			var ft = parseInt(inches / 12).toFixed(0);
			var inch = (inches % 12).toFixed(2);
			var inc=inch.toString().replace('.', '')
			fts_inches=ft+"."+parseInt(inch,10)
			$("form input[name='height_in_inches']").val(fts_inches)
			
		});
		$('form input[name="weight"]').bind('change', function() { 
			var pounds=$(this).val()/0.45359237
			$("form input[name='weight_in_pounds']").val(pounds.toFixed(2))
			
		});
		
		/*frappe.datetime.get_diff(doc.schedule_date) < 1*/
		$('form input[name="str_date_of_birth"]').bind('change', function() { 
			val=$(this).val()
			if (diffDays(parseDate(val),new Date().setHours(0,0,0,0)) < 0) { 
				$(this).val("")
    			frappe.msgprint("OOP's Date of Birth is not valid")
			}
		});
		if (sessionStorage.getItem("cid")==sessionStorage.getItem("pid")){
			$($('input[name="relationship"]').parents()[3]).css("display", "none");
			if ($('input[name="email"]').val()){
				$('input[name="email"]').prop('disabled',true)
			}
			//me.verify_mobile()  				
  		}
  		

	},
	render_field: function(profile_id){
		var me = this;
		frappe.require("assets/phr/jasny-bootstrap/js/jasny-bootstrap.js");
		frappe.require("assets/phr/jasny-bootstrap/js/jasny-bootstrap.min.js");
		$('.fileinput').fileinput()
				
		$('.save_controller').bind('click',function(event) {
			var validated=me.validate_form()	
			NProgress.start();
			if (validated['fg']==true){
				me.res = {};
				selected=[]
				// $(".tab-pane.active form input, .tab-pane.active form textarea, .tab-pane.active form select").each(function(i, obj) {
				// 	me.res[obj.name] = $(obj).val();	 
				// })
				$("form input, form textarea, form select").each(function(i, obj) {
					me.res[obj.name] = $(obj).val();	 
				})
				me.res["entityid"]=profile_id
				me.res["received_from"]="Desktop"
				me.get_method(me.res,'basic_info',me,selected)

				// me.make_profile_noeditable()
			}
			else{
				NProgress.done();
				frappe.msgprint(validated["msg"])
				return false
			}		
		})
		var files = [];
 		object = {};
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
  		msg=""
  		$("form input[required], form textarea[required], form select[required]").each(function(i, obj) {
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
  		if($('form input[name="mobile"]').val()){
  			if (!validate_mobile($('form input[name="mobile"]').val())) {
  				msg="Mobile No Invalid"
  				fg=false
  			}
  		}
  		return {
  			"fg":fg,
  			"msg":msg
  		}	
  	},
  	get_user_image:function(profile_id){
  		var me = this;
  		frappe.call({
			method:'phr.templates.pages.profile.get_user_image',
			args:{"profile_id":profile_id},
			callback: function(r) {
				if (r.message["image"]){
					$('.profile_photo').empty();

					$('<img style="max-width:123px;max-height:119px;" src="'+r.message["image"]+'"alt="user image">\
						<a class="edit_photo_link" nohref><img src="assets/phr/images/change-photo.png"> Edit</a>\
					').appendTo($('.profile_photo'))
					me.upload_image()
					NProgress.done();
				}
			}
		});		
  	},
	upload_image:function(object,profile_id){
		var me = this;
		$('.edit_photo_link').bind('click',function(event) {
			$('#myModal').remove()
			$('.modal').remove()

			d = new Dialog();
			d.init({"title":"File Uploader/ Writer"})
			d.show()
			
			$('.modal-dialog').removeClass('modal-lg').addClass('modal-sm');
			$('.modal-body').empty();
			$('.modal-footer .btn-primary').hide();
			$('#desc').hide('fast');
			me.make_image_uploader(d)
		})
	},
	make_image_uploader:function(d){
		var me =this;
		// console.log($('input[name="entityid"]').val())
		upload.make({
			parent: $('.modal-body'),
			args:{'profile_id': me.entityid, 'dialog': d},
			callback:function(attachment, r) {
				// NProgress.done();
				me.set_image(attachment)
				// console.log(attachment['file_name'])
			}
		});
	},
	set_image: function(attachment){
		var me = this;
		frappe.call({
			method:'phr.templates.pages.profile.upload_image',
			args:{"profile_id": me.entityid, "file_name": attachment['file_name']},
			callback: function(r) {
				me.get_user_image(me.entityid)
				// NProgress.done();
				// if(r.message) {
				// 	frappe.msgprint(r.message);
				// }
			}
		});
	},
	get_method:function(res,cmd,me,selected){
		frappe.call({
			method:'phr.templates.pages.profile.update_profile',
			args:{"data": res,"id":cmd,"dashboard":selected},
			callback: function(r) {
				NProgress.done();
				response = r.message
				frappe.msgprint(response["msg"])
				if(response["rtcode"]==100) {
					me.make_mv_entry(sessionStorage.getItem("cid"),response["mob_no"],response["user"])
					$(me.wrapper).empty()
					$('.field-area').empty()
					HTMLViewer.prototype.init(me.wrapper, me.args, me.entityid)
					$('#share').remove()
					me.make_profile_noeditable(me.entityid)
					me.get_user_image(me.entityid)
					// scroll_top()
					email_msg='Linked PHR Has Updated His Profile'
					text_msg='Linked PHR Has Updated His Profile'
					send_linkedphr_updates(email_msg,text_msg,"Profile")

				}
			}
		})
	},
	make_mv_entry:function(profile_id,mobile,user){
		frappe.call({
			method:'phr.templates.pages.profile.make_mv_entry',
			args:{"mobile":mobile,"user":user,"profile_id":profile_id},
			callback: function(r) {
			}
		})

	}
})


