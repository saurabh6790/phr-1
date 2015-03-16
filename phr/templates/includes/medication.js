frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}
{% include "templates/includes/list_view.js" %}
{% include "templates/includes/linked_phr_updates.js" %}


var Medications = inherit(ListView,{
	init: function(wrapper, json_file, profile_id, entity_id){
		this.wrapper = wrapper;
		var me = this;
		this.profile_id = profile_id
		$(this.wrapper).empty()
		$('.field-area').empty()
		ListView.prototype.init($(document).find(".field-area"), {"file_name" : "medication",
			'cmd':"medication.get_medication_data",
			'profile_id':profile_id})
		$('.new_controller').remove();
		//me.update_select_options()
		me.bind_save_event()

	},
	/*update_select_options:function(){
		frappe.call({
		method:"phr.templates.pages.medication.get_dosage_types",
		callback:function(r){
			if(r.message){
				$.each(r.message,function(i, val){
					$option=$('<option>', { 
						'value': val[0],
						'text' : val[0] 
					}).appendTo($('select[name="dosage_type"]'))
				})
			}
			else{
					
				}
			}
		})
	},*/
	bind_save_event: function(){
		var me = this;
		this.res = {}
		this.result_set = {};
		this.doc_list = []
		$('form input[required],form textarea[required],form select[required]').bind('change', function() { 
   			if (!$(this).val()){
   				$(this).css({"border": "1px solid #999","border-color": "red" });
   			}
   			else{
   				$(this).css({"border": "1px solid #999","border-color": "F3F2F5" });	
   			}
		});
		$('form input[name="to_date_time"]').bind('change', function() { 
			val=$(this).val()
			//console.log(diffDays(parseDate(val),parseDate($('form input[name="to_date_time"]').val())))
			if (diffDays(parseDate(val),parseDate($('form input[name="from_date_time"]').val())) > 0) { 
				$(this).val("")
    			frappe.msgprint("To Date Should be less than From date")
			}
		}); 
		$('.update').bind('click',function(event) {
			NProgress.start();
			var validated=me.validate_form()
			if (validated==true){
				$("form input, form textarea, form select").each(function(i, obj) {
					me.res[obj.name] = $(obj).val();
				})
				me.res['profile_id'] = me.profile_id;
				me.res['file_name']="medication";
				me.res['param']="listview";
				frappe.call({
					method:"phr.templates.pages.medication.make_medication_entry",
					args:{"data":JSON.stringify(me.res)},
					callback:function(r){
						NProgress.done();
						if(r.message){
							me.update_list_view(r.message)
							me.bind_save_event()
							email_msg='Linked PHR Has Created Medication'
							text_msg='Linked PHR Has Created Medication'
							send_linkedphr_updates(email_msg,text_msg,"Medication")
						}
						else{
						
						}
					}
				})
			}
			else{
				NProgress.done();
				frappe.msgprint("Fields Marked as Red Are Mandatory")
				return false
			}			
		})
		$('.medication').bind('click',function(event){
			data={}
			docname=$(this).prop('id')
			data["docname"]=docname
			data["profile_id"]=me.profile_id
			data['file_name']="medication";
			data['param']="listview";
			BootstrapDialog.confirm('Are you sure,you want to Deactivate/Stop this meedication?', function(result){
				if(result){
					me.update_status(data)
				}

			});
			
		})
		
	},
	update_status:function(data){
		var me=this;
		frappe.call({
			method:"phr.templates.pages.medication.update_status",
			args:{"data":data},
			callback:function(r){
				NProgress.done();
				if(r.message){
					me.update_list_view(r.message)
					me.bind_save_event()
				}
				else{
				}
			}
		})
	},
  	validate_form:function(){
  		var me=this;
  		var fg=true
  		$("form input[required],form textarea[required],form select[required]").each(function(i, obj) {
  			if ($(this).val()==""){
  				$(this).css({"border": "1px solid #999","border-color": "red" });
  				fg=false
  			}
  		})
  		return fg	
  		
  	},
	update_list_view:function(data){
		RenderFormFields.prototype.init($(".field-area"), {'fields': data['listview']})
		$('.save_controller').remove();
	}
})