frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}

var PatientDashboard = inherit(RenderFormFields, {
	init: function(wrapper,cmd, entityid){
		this.wrapper = wrapper;
		this.args=cmd
		this.entityid=entityid
		RenderFormFields.prototype.init(this.wrapper,this.args,this.entityid)
		this.render_field()
	},
	render_field: function(){
		var me = this;
		$('.controller').bind('click',function(event) {
			me.res = {};
			var $id=$('.tab-pane.active').attr('id')
			$(".tab-pane.active form input, .tab-pane.active form textarea, .tab-pane.active form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			me.res["entityid"]=frappe.get_cookie('profile_id')
			me.res["received_from"]="Desktop"
			me.get_method(me.res,$id,me)		
		})
	},
	get_method:function(res,cmd,me){
		console.log(res)
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
