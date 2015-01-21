frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}

var PatientDashboard = inherit(RenderFormFields, {
	init: function(wrapper,cmd, entityid){
		this.wrapper = wrapper;
		this.args=cmd
		this.entityid=entityid
		RenderFormFields.prototype.init(this.wrapper,this.args,this.entityid)
		this.render_field()
		this.get_linked_phrs(frappe.get_cookie('profile_id'))
	},
	render_field: function(){
		var me = this;
		$('.fileinput').fileinput()
		$('.chk').bind('click',function(event){
			if (($("input:checkbox:checked").length)>4){
				alert("You Need to select any Four")
				/*$("input:checkbox:checked").prop('checked', false);*/
				console.log(this)
				$(this).prop('checked', false);
				
			}	
		})
		$('.save_controller').bind('click',function(event) {
			console.log($("input:checkbox:checked").length)
			if (($("input:checkbox:checked").length)!=4){
				alert("You Need to select any Four")
				$("input:checkbox:checked").prop('checked', false);
				return false
				
			}
			me.res = {};
			selected=[]
			var $id=$('.tab-pane.active').attr('id')
			$(".tab-pane.active form input, .tab-pane.active form textarea, .tab-pane.active form select").each(function(i, obj) {
				me.res[obj.name] = $(obj).val();
			})
			$(".chk:checked").each(function() {
				selected.push($(this).val());
  			});	
			me.res["entityid"]=frappe.get_cookie('profile_id')
			me.res["received_from"]="Desktop"
			me.get_method(me.res,$id,me)		
		})
		var files = [];
 		object = {};
		$("input[type=file]").change(function(event) {
			$.each(event.target.files, function(index, file) {
    			var reader = new FileReader();
    			reader.onload = function(event) {  
      				object.filename = file.name;
      				object.data = event.target.result;
      				files.push(object);
    			};  
    			reader.readAsDataURL(file);
  			});
  			console.log([object,"hiiii"])
  		});
  		$(".upload").bind('click',function(){
  			frappe.call({
				method:'phr.templates.pages.profile.upload_image',
				args:{"data":object.data,"file_name":object.filename},
				callback: function(r) {
					console.log(r)
					if(r.message) {
						$("input").val("");
						var dialog = frappe.msgprint(r.message);
					}
				}
			})

  		});
  		
	},
	get_method:function(res,cmd,me){
		frappe.call({
				method:'phr.templates.pages.profile.update_profile',
				args:{'data': res,"id":cmd,"dashboard":selected},
				callback: function(r) {
					console.log(r)
					if(r.message) {
						$("input").val("");
						var dialog = frappe.msgprint(r.message);
					}
				}
			})
		/*var call_mapper={"basic_info":"update_profile","password":"update_password","update_phr":"manage_phr"}
		me[call_mapper[cmd]].call(me,res)*/
	},
	get_linked_phrs:function(profile_id){
		console.log("jhsgajhgsjgsdjg")
		var me=this;
		frappe.call({
				method:'phr.templates.pages.profile.get_linked_phrs',
				args:{'profile_id':profile_id},
				callback: function(r) {
					if(r.message) {
						me.render_phrs(r.message)
					}
				}
			})
	},
	render_phrs:function(data){
		var me=this
		var $wrapper=$('#manage_phr').find('form')		
		meta=JSON.parse(data.actualdata)
		meta_dic={}
		selected=[]
		$.each(meta,function(i,data){
			$input=$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
								<div class="col-xs-8">\
								<div class="control-input">\
									<input type="checkbox" class="chk" name="%(entityid)s" value="%(entityid)s">\
									%(person_firstname)s &nbsp %(person_lastname)s\
								</div>\
							</div>\
						</div>\
				</div>', data.profile)).appendTo($wrapper)	
			//meta_dic[data.profile.entityid]=data.profile.person_firstname+' '+data.profile.person_lastname
		})
		$('<div class="update" style="width:45%;display:inline-block;text-align:right;">\
				<button class="btn btn-primary">\
					Delink \
				</button>\
			</div>').appendTo($wrapper).click(function(){
				BootstrapDialog.confirm('Hi Apple, are you sure?', function(result){
           			 if(result) {
                		$(".chk:checked").each(function() {
							selected.push($(this).val());
  						});
						me.delink_phr(meta,selected)
            		}else {
                		alert('Nope.');
            		}
        		});
				
			})
	},
	delink_phr:function(meta,selected){
		console.log([meta,selected])
	}
	
})
