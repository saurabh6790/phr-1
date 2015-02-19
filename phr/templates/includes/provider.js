frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/linked_phr_updates.js" %}

var Provider = inherit(RenderFormFields, {
	init: function(wrapper,cmd, entityid,operation){
		this.wrapper = wrapper;
		this.args=cmd
		this.entityid=entityid
		this.operation=operation
		$(this.wrapper).empty()
		$('.field-area').empty()
		RenderFormFields.prototype.init(this.wrapper,this.args,this.entityid,this.operation)
		this.render_field()
	},
	render_field: function(){
		var me = this;
		$('.save_controller').bind('click',function(event) {
			NProgress.start();
			me.res = {};
			var $id=$('.tab-pane.active').attr('id')
			$("form input,form textarea,form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			me.res["received_from"]="Desktop"
			me.res["provider"]=true
			if (me.operation=='create_provider'){
				me.create_provider(me.res,$id,me)
			}
		})
	},
	create_provider:function(res,cmd,me){
		frappe.call({
			method:'phr.templates.pages.provider.create_provider',
			args:{'data': res,"id":cmd,"profile_id":sessionStorage.getItem("cid")},
			callback: function(r) {
				NProgress.done();
				if(r.message) {
					if(r.message.returncode==129){
						$("input").val("");
						frappe.msgprint(r.message.message_summary)
						me.add_profile_to_link(r.message.actualdata,r.message.entityid)
						email_msg='Linked PHR Has Created provider'
						text_msg='Linked PHR Has Created provider'
						send_linkedphr_updates(email_msg,text_msg,"provider")
					}
					else{
						frappe.msgprint(r.message.message_summary)
					}
				}
			}
		})
	},
	add_profile_to_link:function(data,entityid){
		var db = new render_dashboard();
		db.render_providers(sessionStorage.getItem("cid"))
	}	
})
