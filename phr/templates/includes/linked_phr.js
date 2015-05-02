frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/dashboard_renderer.js" %}

var LinkedPHR = inherit(RenderFormFields, {
	init: function(wrapper,cmd, entityid,operation){
		this.wrapper = wrapper;
		this.args=cmd
		this.entityid=entityid
		this.operation=operation
		$(this.wrapper).empty();
		$('.field-area').empty();
		RenderFormFields.prototype.init(this.wrapper,this.args,this.entityid,this.operation)
		this.render_field(this.entityid)
		$('#share').remove()
		scroll_top()	
	},
	render_field: function(profile_id){
		$('form input[required],form textarea[required],form select[required]').bind('input', function() { 
   			if (!$(this).val()){
   				$(this).css({"border": "1px solid #999","border-color": "red" });
   			}
   			else{
   				$(this).css({"border": "1px solid #999","border-color": "F3F2F5" });	
   			}
		});
		$('form input[name="person_firstname"]').bind('change', function() { 
			name=$(this).val()+"'s Relationship With you"
			$("form input[name='relationship']").prop("placeholder",name)
		});
		if (frappe.get_cookie("user_type") && frappe.get_cookie("user_type")=="provider"){
			$("form input[name='relationship']").val("patient")
		}
		var me = this;
		$('.save_controller').bind('click',function(event) {
			if (!(sessionStorage.getItem("lphrs")>=10)){
				me.res = {};
				NProgress.start();
				var validated=me.validate_form()
				if (validated['fg']==true){	
					$("form input,form textarea,form select").each(function(i, obj) {
						me.res[obj.name] = $(obj).val();
					})	
					me.res["linking_id"]=sessionStorage.getItem("pid")
					me.res["received_from"]="Desktop"
					if (me.operation=='create_linkphr'){
						me.res["parent_linked"]=true
						me.create_linkedphr(me.res,me)
					}
				}
				else{
					NProgress.done();
					frappe.msgprint(validated['msg'])
					return false
				}
			}
			else{
				frappe.msgprint("Linked PHR's Limit Exceeded.Please Contact Admin or Delink One of Existing PHR")
			}
		})
	},
  	validate_form:function(){
  		var me=this;
  		var fg=true;
  		var msg = '';
  		$("form input[required],form textarea[required],form select[required]").each(function(i, obj) {
  			if ($(this).val()==""){
  				$(this).css({"border": "1px solid #999","border-color": "red" });
  				fg=false;
  				msg = "Fields Marked as Red Are Mandatory"
  			}
  		})
  		if ($('form input[name="mobile"]').val() && !validate_mobile($('form input[name="mobile"]').val())) {
  			fg = false
  			msg = "Mobile Number is Invalid"
  		}
  		
  		if ($('form input[name="email"]').val() && !valid_email($('form input[name="email"]').val())) {
  			fg = false
  			msg = "Email Id is Invalid"
  		}
  		$("form input[required],form textarea[required],form select[required]").each(function(i, obj) {
  			if(!/^[a-zA-Z ]*$/.test($(this).val())){
  				fg=false;
  				msg = "Please input alphabet characters only"
  			}
  		})

  		return {'fg':fg, 'msg':msg}	
  		
  	},
	create_linkedphr:function(res,me){
		var me = this;
		frappe.call({
				method:'phr.templates.pages.linked_phr.create_linkedphr',
				args:{'data': res},
				callback: function(r) {
					NProgress.done();
					if(r.message) {
						if(r.message.returncode==122){
							frappe.msgprint(r.message.message_summary)
							$("input").val("");
							$("form input[name='relationship']").prop("placeholder","")
							var db = new render_dashboard();
							db.render_linked_phr(sessionStorage.getItem("pid"))
						}
						else{
							frappe.msgprint(r.message.message_summary)
						}
					}
				}
			})
	}
})
