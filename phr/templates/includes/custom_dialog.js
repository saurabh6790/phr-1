frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}

var Dialog = function(){
	this.wrapper=""
}

$.extend(Dialog.prototype,{
	init: function(field_list){
		this.field_list = field_list;
		this.title = field_list['title'];
		this.button_title = field_list['button_title'] || "Ok";
		this.make();
		this.make_head();
	},
	make:function(){
		this.$wrapper = this.get_diloag();
		this.render_filed_dict();
	},
	get_diloag:function(){
		$('.modal-body').empty();
		$dialog = $('<div id="myModal" class="modal fade">\
				  <div class="modal-dialog modal-lg">\
				    <div class="modal-content">\
				      <div class="modal-header">\
				      	<button type="button" class="close" data-dismiss="modal">&times;</button>\
				      	<div class="modal-title"></div>\
				      </div>\
				      <div class="modal-body">\
					  </div>\
				      <div class="modal-footer">\
				      	<button type="button" class="btn btn-primary btn-sm"></button>\
				      </div>\
				    </div>\
				  </div>\
				</div>').appendTo(document.body);

		return $dialog;
	},
	render_filed_dict:function(){
		if (this.field_list['file_name'] || this.field_list['fields']) RenderFormFields.prototype.init('', this.field_list, '', '', this.$wrapper)
	},
	make_head: function() {
		var me = this;
		//this.appframe = new frappe.ui.AppFrame(this.wrapper);
		//this.appframe.set_document_title = false;
		this.set_title(this.title);
		this.set_button_title(this.button_title)
	},
	set_title: function(t) {
		this.$wrapper.find(".modal-title").html(t);
	},
	set_button_title: function(bt){
		this.$wrapper.find(".btn-primary").html(bt);	
	},
	show: function() {
		// show it
		this.$wrapper.modal("show");
	},
	hide: function(from_event) {
		this.$wrapper.modal("hide");
	},
	no_cancel: function() {
		this.$wrapper.find('.close').toggle(false);
	}
})