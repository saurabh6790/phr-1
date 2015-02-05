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

var ToDo = inherit(ListView,{
	init: function(wrapper, obj, profile_id, entity_id){
		this.wrapper = wrapper;
		this.res = {};
		this.profile_id = profile_id
		this.render_todo_list()
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
			me.res['profile_id'] = me.profile_id

			frappe.call({
				method:"phr.templates.pages.todo.create_todo",
				args: {'data':me.res},
				callback:function(r){
					d.hide()
					frappe.msgprint('ToDo Record Created')
					//me.add_todo(r.message)
				}
			})
		})
	},
	add_todo: function(todo){
		$wrap=$('#todo')

		pro_data={"desc": todo['description'], "todo_id": todo["name"]}
		
		$(repl_str('<div class="list-group-item-side %(todo_id)s">\
			<a noherf data-name=%(todo_id)s>%(desc)s </a>\
			<p class="text-muted small">%(todo_id)s </p>\
			</div>', pro_data)).appendTo($wrap)
	},
	render_todo_list: function(){
		var me = this;
		frappe.call({
			method:"phr.templates.pages.todo.get_todo",
			args: {'profile_id':me.profile_id},
			callback:function(r){
				$('#todo').empty()
				$.each(r.message, function(i, d){
					me.add_todo(d)
				})
			}
		})
	}
})