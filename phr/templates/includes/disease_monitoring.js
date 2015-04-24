frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/event.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/custom_dialog.js" %}
{% include "templates/includes/linked_phr_updates.js" %}

var DiseaseMonitoring = inherit(RenderFormFields, {
	init: function(wrapper,cmd, entityid,operation){
		this.wrapper = wrapper
		this.args=cmd
		this.entityid=entityid
		this.operation=operation
		$(this.wrapper).empty();
		$('.field-area').empty();
		this.render_master_select(this.wrapper)
	},
	render_master_select: function(event_title){

		var me = this;
		$('.field-area').empty()
		$input = $('<div class="panel panel-white no-radius events row sec">\
			<div class="panel-heading border-light he"><h4 class="panel-title"> Disease Selection</h4></div>\
			<div class="panel-body margin-top-15 bod">\
			<div class="form-column col-md-12" style="margin-top:10px;">\
			<form><div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;margin-bottom:5px">\
			<div class="form-group row" style="margin: 0px">\
			<label class="control-label small col-xs-4" style="padding-right: 0px;">Disease</label>\
			<div class="col-xs-8"><div class="control-input">\
			<select type="text" class="form-control" name="disease">\
			</div></div></div></div></form></div></div></div>').appendTo($('.field-area'))
		frappe.call({
			method:"phr.templates.pages.disease_monitoring.get_diseases",
			callback:function(r){
				if(r.message){
					$.each(r.message,function(i, val){
						$option=$('<option>', { 
							'value': val[0],
							'text' : val[0] 
						}).appendTo($($input).find('select'))
					})
					//if (!event_title) event_title=r.message[0][0]
					me.render_disease_fields(r.message[0][0],me.entityid,me)
				}
				else{
					$option=$('<option>', { 
						'value': "",
						'text' : "" 
					}).appendTo($($input).find('select'))
				}
			}
		})
		
		$(($input).find('select')).on('change', function(){
			me.render_disease_fields($(this).val(), me.entityid, me)		
		})
	},
	render_disease_fields:function(value,profile_id,me){
		this.profile_id = profile_id;
		frappe.call({
			method:"phr.templates.pages.disease_monitoring.get_disease_fields",
			args:{"name":value,"profile_id":profile_id},
			callback:function(r){
				if (r.message){
					data=r.message
					RenderFormFields.prototype.init($("#main-con"), {'fields':data["fields"]})
					me.bind_save_event(me,data["event_master_id"],profile_id,value,data["fields"],data["field_mapper"],data["raw_fields"])
					me.add_share_event()
				}
				else{
					$('#main-con').empty();	
				}
			}
		})

	},
	bind_save_event:function(me,event_id,profile_id,value,fields,field_mapper,raw_fields){
			$('.save_controller').bind('click',function(event) {
				NProgress.start();
				var $id=$('.tab-pane.active').attr('id')
				me.res = {};
				selected=[]
				var $id=$('.tab-pane.active').attr('id')
				$("form input,form textarea,form select").each(function(i, obj) {
					me.res[obj.name] = $(obj).val();
				})
				var date=""
				if ($('input[data-fieldtype="DateTime"]') || $('input[data-fieldtype="Date"]')){
					var date=$('input[data-fieldtype="DateTime"]').val() || $('input[data-fieldtype="Date"]').val()
				}
				
				arg={"profile_id":profile_id,"received_from":"Desktop","event_master_id":event_id,"event_title":value,"date":date}
				me.save_dm(me.res,arg,fields,field_mapper,raw_fields,me,value,profile_id)
			})
	},
	save_dm:function(data,arg,fields,field_mapper,raw_fields,me,event_title,profile_id){
		frappe.call({
			method:"phr.templates.pages.disease_monitoring.save_dm",
			args:{"data":data,"arg":arg,"fields":fields,"field_mapper":field_mapper,"raw_fields":raw_fields},
			callback:function(r){
				data=r.message
				if (r.message){
					NProgress.done();
					RenderFormFields.prototype.init($("#main-con"), {'fields':data["fields"]})
					me.add_share_event()
					me.render_disease_fields(event_title,profile_id,me)
					email_msg='Linked PHR Has Created DiseaseMonitoring'
					text_msg='Linked PHR Has Created DiseaseMonitoring'
					send_linkedphr_updates(email_msg,text_msg,"DiseaseMonitoring")
				}
				else{
						
				}
			}
		})
	},
	add_share_event:function(){
		var me = this;
		this.selected_dm = []
		$('.share').remove();
		$("<button class='btn btn-primary share'> Share </button>").click(function(){
			me.make_sharing_dialog();
			$('.table').find('tr').each(function () {
				var row = $(this);
				$('td', row).map(function(index, td) {
				    if ($(td).find('input[type="checkbox"]').is(':checked')) {
						me.selected_dm.push($(row[0]).html())
					}
				});

			})
		}).appendTo('.field-area')
	},
	make_sharing_dialog: function(){
		var me = this;
		d = new Dialog();
		d.init({"file_name":"share_dm", "title":"Linked Providers"})
		d.show()
		this.res = {}
		Events.prototype.get_linked_providers(this.profile_id)
		$('.modal-footer .btn-primary').unbind("click").click(function(){
			$(".modal-body form input, .modal-body form textarea, .modal-body form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			me.share_data(d);
		})
	},
	share_data:function(d){
		var me = this;
		NProgress.start();
		frappe.call({
			method:"phr.templates.pages.disease_monitoring.share_dm",
			args:{'data':me.selected_dm, 'header': $('.fixed-table-header').find('thead').html(), 'share_info':me.res,
			 'profile_id':me.profile_id, 'disease':$('[name="disease"]').val()},
			callback:function(r){
				d.hide()
				var $modal = $("#myModal").detach().modal();
				$modal.modal("hide");
				$modal.modal("destroy").remove();
				NProgress.done();
			}
		})
	}
})
