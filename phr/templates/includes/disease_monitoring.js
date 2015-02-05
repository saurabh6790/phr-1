frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}

var DiseaseMonitoring = inherit(RenderFormFields, {
	init: function(wrapper,cmd, entityid,operation){
		console.log(wrapper)
		this.wrapper = wrapper
		this.args=cmd
		this.entityid=entityid
		this.operation=operation
		$(this.wrapper).empty();
		$('.field-area').empty();
		this.render_master_select(this.wrapper)
	},
	render_master_select: function(wrapper){
		var me = this;
		$input = $('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;margin-bottom:5px">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label small col-xs-4" style="padding-right: 0px;">Disease</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<select type="text" class="form-control" \
										name="disease">\
								</div>\
							</div>\
						</div>\
				</div>').appendTo($('.field-area'))
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
			me.render_disease_fields($(this).val(),me.entityid,me)		
		})
	},
	render_disease_fields:function(value,profile_id,me){
		frappe.call({
			method:"phr.templates.pages.disease_monitoring.get_disease_fields",
			args:{"name":value,"profile_id":profile_id},
			callback:function(r){
				console.log(r.message[0])
				if (r.message){
					data=r.message
					RenderFormFields.prototype.init($("#main-con"), {'fields':data["fields"]})
					me.bind_save_event(me,data["event_master_id"],profile_id,value,data["fields"],data["field_mapper"],data["raw_fields"])
				}
				else{
					$('#main-con').empty();	
				}
			}
		})

	},
	bind_save_event:function(me,event_id,profile_id,value,fields,field_mapper,raw_fields){
			$('.save_controller').bind('click',function(event) {
				var $id=$('.tab-pane.active').attr('id')
				me.res = {};
				selected=[]
				var $id=$('.tab-pane.active').attr('id')
				$("form input,form textarea,form select").each(function(i, obj) {
					me.res[obj.name] = $(obj).val();
				})
				arg={"profile_id":profile_id,"received_from":"Desktop","event_master_id":event_id,"event_title":value}
				me.save_dm(me.res,arg,fields,field_mapper,raw_fields)
			})
	},
	save_dm:function(data,arg,fields,field_mapper,raw_fields){
		frappe.call({
			method:"phr.templates.pages.disease_monitoring.save_dm",
			args:{"data":data,"arg":arg,"fields":fields,"field_mapper":field_mapper,"raw_fields":raw_fields},
			callback:function(r){
				data=r.message
				if (r.message){
					console.log("hiii i am to re render")
					console.log(data["fields"])
					RenderFormFields.prototype.init($("#main-con"), {'fields':data["fields"]})
					//me.bind_save_event(me,r.message[1],profile_id)
				}
				else{
						
				}
			}
		})
	}
})
