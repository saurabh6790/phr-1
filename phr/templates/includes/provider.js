frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/custom_dialog.js" %}
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
	},
	open_record:function(provider_id){
		$(this.wrapper).empty()
		$('.field-area').empty()
		$('#main-con').empty()
		RenderFormFields.prototype.init(this.wrapper, {"file_name" : "provider", "method": 'provider'}, provider_id)
		this.get_addr(provider_id)
		this.add_address(provider_id)
		$('#share').remove()
		$('.save_controller').remove()

	},
	get_addr: function(provider_id){
		var me =this;
		frappe.call({
			method:"phr.templates.pages.provider.get_address",
			args:{'provider_id': provider_id},
			callback:function(r){
				$('.description').empty()
				me.address_renderer(r.message)
			}
		})
	},
	address_renderer:function(address){
		$.each(address, function(i, addr){
			description = [];
			$.each([
				['addr_line1', '<b>Address Line1</b>'],
				['addr_line2', '<b>Address Line2</b>'],
				['city', '<b>City</b>'],
				['state', '<b>State</b>'],
				['country', '<b>Country</b>'],
				['pincode', '<b>Pincode</b>'],
				['visiting_hours', '<b>Visiting Hours</b>']],
				function(i, v) {
					if(addr[v[0]]) {
						description.push(repl('<b>%(label)s:</b> %(value)s', {
							label: v[1],
							value: addr[v[0]],
					}));
				}
			})
			addr = description.join('<br />');

			$(repl_str("\
				<div class='description' style='padding-top:2%'>\
					<p>%(description)s</p>\
					<hr>\
				</div>", {'description':addr})).appendTo($(".sec_address"))
		});
	},
	add_address:function(provider_id){
		var me = this;
		$('<button class="btn btn-primary">\
			<i class="icon-plus"></i> Add New Address \
		</button>')
		.appendTo($(".sec_address"))
		.click(function(){
			me.make_address(provider_id)
		})
	},
	make_address: function(provider_id){
		var me = this;
		d = new Dialog();
		d.init({"file_name":"address", "title":"Address"})
		d.show()
		this.res = {}
		$('.modal-footer .btn-primary').click(function(){
			$(".modal-body form input, .modal-body form textarea, .modal-body form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			me.res["received_from"]="Desktop"
			me.save_address(me.res, d, provider_id)
		})
	},
	save_address:function(res, d, provider_id){
		var me = this;
		frappe.call({
			method:"phr.templates.pages.provider.create_addr",
			args:{'res': res, 'provider_id': provider_id},
			callback:function(r){
				d.hide()
				me.get_addr(provider_id)
			}
		})
	}
})
