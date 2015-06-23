frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/share_phr.js" %}
{% include "templates/includes/custom_dialog.js" %}
{% include "templates/includes/dashboard_renderer.js" %}

var ToDo = inherit(ListView,{
	init: function(wrapper, obj, profile_id, entity_id){
		this.wrapper = wrapper;
		this.res = {};
		this.profile_id = profile_id
		this[obj['cmd']].call(this)

	},
	make_todo:function(){
		var me = this;
		d = new Dialog();
		d.init({"file_name":"todo", "title":"To Do", "button_title": "Create To Do"})
		d.show()
		$('.modal-body form input[name="due_date"]').bind('blur', function() { 
			val=$(this).val()
			if (val){
				frappe.call({
					method:"phr.templates.pages.todo.validate_date_time",
					args: {'todo_datetime':val},
					callback:function(r){
						if (r.message){
							frappe.msgprint(r.message)
						}
						
					}
				})
			}
		});
		$('.modal-footer .btn-primary').unbind('click').click(function(){
			var validated=me.validate_form_model()
			if (validated['fg']==true){
				$('.modal-footer .btn-primary').prop("disabled", true);
				$(".modal-body form input, .modal-body form textarea, .modal-body form select").each(function(i, obj) {
					me.res[obj.name] = $(obj).val();
				})
				 
				me.res['profile_id'] = sessionStorage.getItem("pid")

				frappe.call({
					method:"phr.templates.pages.todo.create_todo",
					args: {'data':me.res},
					callback:function(r){
						d.hide()
						$('#myModal').remove();
						$('.modal').remove();
						$('.modal-backdrop').remove();
						frappe.msgprint('To Do Record Created')
						var db = new render_dashboard();
						db.render_to_do(sessionStorage.getItem("pid"))
					}
				})
			}
			else{
				frappe.msgprint(validated["msg"])
				return false
			}
		})
	},
	validate_form_model:function(){
		var fg=true
  		msg=""
		$(".modal-body form input[required],.modal-body form textarea[required],.modal-body form select[required]").each(function(i, obj) {
  			if ($(this).val()==""){
  				$(this).css({"border": "1px solid #999","border-color": "red" });
  				fg=false
  				msg="Fields Marked As red Are Mandatory"
  			}
  		})
  		return {
  			"fg":fg,
  			"msg":msg
  		}
	},
})