frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}
{% include "templates/includes/list_view.js" %}
{% include "templates/includes/thumbnail.js" %}
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
		d.init({"file_name":"todo", "title":"ToDo"})
		d.show()
		$('.modal-footer .btn-primary').click(function(){
			$(".modal-body form input, .modal-body form textarea, .modal-body form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			me.res['profile_id'] = sessionStorage.getItem("pid")

			frappe.call({
				method:"phr.templates.pages.todo.create_todo",
				args: {'data':me.res},
				callback:function(r){
					d.hide()
					frappe.msgprint('ToDo Record Created')
					var db = new render_dashboard();
					db.render_to_do(sessionStorage.getItem("pid"))
				}
			})
		})
	}
})