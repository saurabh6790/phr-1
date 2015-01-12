frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}

var LinkedPHR = inherit(RenderFormFields, {
	init: function(wrapper,cmd, entityid,operation){
		this.wrapper = wrapper;
		this.args=cmd
		this.entityid=entityid
		this.operation=operation
		RenderFormFields.prototype.init(this.wrapper,this.args,this.entityid,this.operation)
		this.render_field()
	},
	render_field: function(){
		var me = this;
		$('.save_controller').bind('click',function(event) {
			me.res = {};
			var $id=$('.tab-pane.active').attr('id')
			$(".tab-pane.active form input, .tab-pane.active form textarea, .tab-pane.active form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			me.res["linking_id"]=frappe.get_cookie('profile_id')
			me.res["received_from"]="Desktop"
			console.log(me.operation)
			if (me.operation=='create_linkphr'){
				me.res["parent_linked"]=true
				me.create_linkedphr(me.res,$id,me)
			}
			else if (me.operation=='open_linkphr') {
				me.update_phr(me.res,$id,me)
			};		
		})
	},
	create_linkedphr:function(res,cmd,me){
		frappe.call({
				method:'phr.templates.pages.linked_phr.create_linkedphr',
				args:{'data': res,"id":cmd},
				callback: function(r) {
					console.log(r)
					if(r.message) {
						$("input").val("");
						var dialog = frappe.msgprint(r.message);
					}
				}
			})
		/*var call_mapper={"basic_info":"update_profile","password":"update_password","update_phr":"manage_phr"}
		me[call_mapper[cmd]].call(me,res)*/
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
		/*var call_mapper={"basic_info":"update_profile","password":"update_password","update_phr":"manage_phr"}
		me[call_mapper[cmd]].call(me,res)*/
	}



})
