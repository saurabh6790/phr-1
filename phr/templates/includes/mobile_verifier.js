

window.MobileVerifier = function(){
	this.wrapper = ""
}

$.extend(window.MobileVerifier.prototype,{
	init:function(){
		this.wrapper = wrapper;
		this.args = args;
	},
	check_contact_verified:function(mobile){
		if(mobile){
			var me = this;
			mobile_no = mobile
			frappe.call({
				method:"phr.templates.pages.profile.check_contact_verified",
				args:{"mobile":mobile_no},
				callback:function(r){
					if(r.message==true){
						$('#vm').remove()
					}
					else{
						me.verify_mobile_dialog(mobile_no,sessionStorage.getItem('cid'))				
					}
				}
			})
		}
		else{
			$('#vm').remove()
		}

	},
	verify_mobile_dialog:function(mobile){
		var me = this;
		$("#verify_mobile").click(function(){
			$('#myModal').remove();
			$('.modal').remove();
			$('.modal-backdrop').remove();;
			fields=[{
   				"fieldname": "verify_mobile", 
				"fieldtype": "section_break", 
   				"label": "Verify Mobile",
   				"options":"<i class='fa fa-user-secret'></i>", 
  				},
				{
   				"fieldname": "code", 
				"fieldtype": "data", 
   				"label": "Verification Code", 
   				"placeholder": "", 
  			}] 
			d = new Dialog();
			d.init({'fields':fields,"title":"Verify Mobile","button_title": "Verify"})
			d.show()
			$('.modal-footer .btn-primary').unbind('click').click(function(){
				if ($(".modal-body form input[code]").val()!=""){
					me.resobj={}
					$('.modal-footer .btn-primary').prop("disabled", true);
					$(".modal-body form input").each(function(i, obj) {
						me.resobj[obj.name] = $(obj).val();
					})
				 	me.resobj['profile_id'] = sessionStorage.getItem("pid")
				 	me.verify_code(me.resobj,mobile)
				}
				else{
					frappe.msgprint("Please Enter verification Code")
				}
			})
		})
	},
	verify_code:function(res,mobile){
		var me = this;
		frappe.call({
			method:"phr.templates.pages.profile.verify_code",
			args: {"data":res,"mobile":mobile},
			callback:function(r){
				res=r.message
				$('.modal-footer .btn-primary').prop("disabled", false);
				if (res["returncode"]==0){
					frappe.msgprint(res["message"])
				}
				else if(res["returncode"]==1){
					d.hide()
					$('#myModal').remove();
					$('.modal').remove();
					$('.modal-backdrop').remove();
					$('#vm').remove();
					frappe.msgprint(res["message"])
				}
			}
		})
	}
})	