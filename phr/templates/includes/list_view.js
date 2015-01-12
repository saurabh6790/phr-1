frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}

var ListView = inherit(RenderFormFields,{
	init: function(wrapper, args){
		// console.log(args)
		var me = this;
		this.wrapper = wrapper;
		this.args = args;
		console.log(args)
		console.log(me.args['tab_at'])
		if (args['cmd']){
			this.get_data()
		}else{
			RenderFormFields.prototype.init(this.wrapper, {'fields': me.args['listview']})
			me.render_top_section()
		}

	},
	get_data:function(){
		var me = this;
		var arg = {}

		$.ajax({
			method: "GET",
			url: "/api/method/phr.templates.pages.event."+me.args['cmd'],
			data: "data="+JSON.stringify({'options':me.args['listview'][me.args['tab_at']]['options']}),
			async: false,
			success: function(r) {
				// console.log(r.message.phr.visitList)
				console.log(r)
				me.args['listview'][me.args['tab_at']]['options'] = r.message;

				RenderFormFields.prototype.init(this.wrapper, {'fields': me.args['listview']})
				// me.open_form()
				me.render_top_section()
			}
		});
	},
	render_top_section: function(){
		var me = this;

		// console.log($('.sub-top-bar.btn'))

		$('.new_controller').remove();
		$('.save_controller').remove();

		$('<div class="new_controller" style="width:45%;display:inline-block;text-align:right;">\
				<button class="btn btn-primary">\
					<i class="icon-plus"></i> New \
				</button>\
			</div>')
			.appendTo($('.sub-top-bar'))
			.bind('click',function(){
				// console.log("in ListView js")
				me.new_form()
				me.status=1
				return me.status
			})
	},
	new_form:function(){
		var me = this;
		// console.log("in form body")
		RenderFormFields.prototype.init(this.wrapper, {'fields':me.args['fields']})
	}
})