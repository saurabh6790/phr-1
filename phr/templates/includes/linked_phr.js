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
		var me = this;
		$('.save_controller').bind('click',function(event) {
			me.res = {};
			NProgress.start();
			var validated=me.validate_form()
			if (validated==true){	
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
				frappe.msgprint("Fields Marked as Red Are Mandatory")
				return false
			}
		})
	},
  	validate_form:function(){
  		var me=this;
  		var fg=true
  		$("form input[required],form textarea[required],form select[required]").each(function(i, obj) {
  			if ($(this).val()==""){
  				$(this).css({"border": "1px solid #999","border-color": "red" });
  				fg=false
  			}
  		})
  		return fg	
  		
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
