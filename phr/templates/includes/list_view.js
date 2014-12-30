frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}

var ListView = inherit(RenderFormFields,{
	init: function(wrapper, args){
		console.log(args)
		this.wrapper = wrapper;
		this.args = args;

		RenderFormFields.prototype.init(this.wrapper, {'fields':[{'fieldname':'event','fieldtype':'link','label':'Event','options':[
    {   
        "label" : "BMW - Z3 - cabrio",
        "value" : "BMWZ3",
        "constructor" : "BMW", 
        "model": "Z3", 
        "type": "cabrio" },

    {   
         "label" : "Porsche - - ",
        "value" : "Porsche911",
        "constructor" : "Porsche", 
        "model": "911", 
        "type": "coupe" },

    {   "label" : "Audi - A3 - coupe",
        "value" : "AudiA3",

         "constructor" : "Audi", 
        "model": "A3", 
        "type": "coupe" },

    {   
        "label" : "Mercedes - A6 - coupe",
        "value" : "mercedessl500",
        "constructor" : "Mercedes", 
        "model": "A6", 
        "type": "coupe" }
]}, 
			{'fieldname':'date','fieldtype':'date','label':'Date'},
			{'fieldname':'tab','fieldtype':'table','label':'T1', 'options':[['Id', 'Name', 'Age'],['1234569', 'Saurabh', '24']]}]})
		
		this.render_top_section()
	},
	render_top_section: function(){
		var me = this;
		$('	<div class="sub-top-bar" style="padding-top:2%;padding-bottom:2%;background-color:#ECECEC; border-top: 1px solid #006DEA; border-bottom: 1px solid #006DEA;">\
				<div class="breadcrumbs" style="width:50%;display:inline-block;">\
					<ol class="breadcrumb">\
					</ol>\
				</div>\
			</div>\
		').appendTo($('.form-controller'))

		$('<div class="controller" style="width:45%;display:inline-block;text-align:right;">\
				<button class="btn btn-primary">\
					<i class="icon-plus"></i> New \
				</button>\
			</div>')
			.appendTo($('.sub-top-bar'))
			.click(function(){
				me.new_form()
			})
	},
	new_form:function(){
		var me = this;
		RenderFormFields.prototype.init(this.wrapper, {'fields':me.args['fields']})
	}
})