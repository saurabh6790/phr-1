frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}

var Provider = inherit(RenderFormFields, {
	init: function(wrapper,cmd, entityid,operation){
		console.log(operation)
		this.wrapper = wrapper;
		this.args=cmd
		console.log(entityid)
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
			console.log("clicked")
			me.res = {};
			var $id=$('.tab-pane.active').attr('id')
			$("form input,form textarea,form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			me.res["received_from"]="Desktop"
			me.res["provider"]=true
			console.log(me.operation)
			if (me.operation=='create_provider'){
				me.create_provider(me.res,$id,me)
			}
			/*else if (me.operation=='open_linkphr') {
				me.update_phr(me.res,$id,me)
			};*/		
		})
	},
	create_provider:function(res,cmd,me){
		frappe.call({
			method:'phr.templates.pages.provider.create_provider',
			args:{'data': res,"id":cmd,"profile_id":sessionStorage.getItem("cid")},
			callback: function(r) {
				console.log(r)
				if(r.message) {
					if(r.message.returncode==129){
						$("input").val("");
						frappe.msgprint(r.message.message_summary)
						me.add_profile_to_link(r.message.actualdata,r.message.entityid)
					}
					else{
						frappe.msgprint(r.message.message_summary)
					}
				}
			}
		})
	},
	update_phr:function(res,cmd,me){
		frappe.call({
				method:'phr.templates.pages.profile.update_profile',
				args:{'data': res,"id":cmd},
				callback: function(r) {
					console.log(r)
					if(r.message) {
						$("input").val("");
						var dialog = frappe.msgprint(r.message);
					}
				}
			})
	},
	add_profile_to_link:function(data,entityid){
		var db = new render_dashboard();
		db.render_providers(sessionStorage.getItem("cid"))
	}	
})
