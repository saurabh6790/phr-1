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
		var me = this;
		$('.save_controller').bind('click',function(event) {
			me.res = {};
			//var $id=$('.tab-pane.active').attr('id')
			$("form input,form textarea,form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			me.res["linking_id"]=sessionStorage.getItem("pid")
			me.res["received_from"]="Desktop"
			if (me.operation=='create_linkphr'){
				me.res["parent_linked"]=true
				me.create_linkedphr(me.res,me)
			}
				
		})
	},
	create_linkedphr:function(res,me){
		console.log($('#linkedphr'))
		var me = this;
		frappe.call({
				method:'phr.templates.pages.linked_phr.create_linkedphr',
				args:{'data': res},
				callback: function(r) {
					console.log(r)
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
