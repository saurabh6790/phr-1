frappe.provide("frappe");
frappe.provide("templates/includes");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
{% include "templates/includes/custom_dialog.js" %}

window.Gallery = function(){
	this.wrapper = ""
}

$.extend(Gallery.prototype, {
	init:function()
})