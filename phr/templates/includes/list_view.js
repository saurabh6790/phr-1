frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}

var ListView = inherit(RenderFormFields,{
	init: function(wrapper, args){
		// console.log(args)
		console.log("from even")
		var me = this;
		this.wrapper = wrapper;
		this.args = args;
		this.profile_id=args["profile_id"]
		console.log(['arg exist', args['cmd'], args])
		if (args['cmd']){
			this.get_data()
		}else{
			console.log(['test'])
			RenderFormFields.prototype.init(this.wrapper, {'file_name': me.args['file_name'], 'param':'listview'})
			me.render_top_section()
		}

	},
	get_data:function(){
		var me = this;
		var arg = {}

		$.ajax({
			method: "GET",
			url: "/api/method/phr.templates.pages.event."+me.args['cmd'],
			data: "data="+JSON.stringify({'file_name':me.args['file_name'],"profile_id":me.profile_id, 'param':'listview'}),
			async: false,
			success: function(r) {
				me.listview = r.message['listview'];
				dataTable = r.message['rows'];

				r.message['listview'][me.args['tab_at']]['rows'] = r.message['rows'];
				RenderFormFields.prototype.init(this.wrapper, {'fields': r.message['listview']})
				
				// me.create_pagination(r.message['options'], r.message['page_size'])
				me.render_top_section()
			}
		});
	},
	create_pagination: function(table_data, page_size){
		this.table_data = table_data;
		this.page_size = page_size;

		no_of_pages = (table_data.length-1) / page_size;

		$('<ul class="pagination ">\
				<li ><a nohref>&laquo;</a></li>\
		</ul>').appendTo($('.field-area'))

		for(i=1 ;i<=no_of_pages; i++){
			$(repl_str('<li ><a nohref>%(count)s</a></li>',{'count':i})).appendTo('.pagination')
		}

		$('<li><a nohref>&raquo;</a></li>').appendTo('.pagination')
		console.log("end of create_pagination")
		this.page_controller()
	},
	page_controller : function(){
		var me = this;
		$('ul li a').click(function(){
			me.render_page($(this).html())
		})
		console.log("end of page_controller")
	},
	render_page: function(page_id){
		next = parseInt(this.page_size) * parseInt(page_id);
		this.listview[this.args['tab_at']]['rows'] = this.table_data.slice((next - parseInt(this.page_size)), next)
		RenderFormFields.prototype.init(this.wrapper, {'fields': this.listview})
		this.create_pagination(this.table_data, this.page_size)
	},
	render_top_section: function(){
		var me = this;

		$('.new_controller').remove();
		$('.save_controller').remove();

		$('<div class="new_controller" style="width:45%;display:inline-block;text-align:right;">\
				<button class="btn btn-primary">\
					<i class="icon-plus"></i> New \
				</button>\
			</div>')
			.appendTo($('.sub-top-bar'))
			.bind('click',function(){
				me.new_form()
				me.status=1
				return me.status
			})
		console.log("end of render_top_section")
	},
	new_form:function(){
		var me = this;
		console.log('in new form')
		RenderFormFields.prototype.init(this.wrapper, {'file_name': me.args['file_name']})
	}
})