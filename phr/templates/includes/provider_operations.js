frappe.provide("frappe");
frappe.provide("templates/includes");

var ProviderOperations = function(){
	this.wrapper = ""
}

$.extend(ProviderOperations.prototype, {
	dialog_oprations: function(args){
		var me = this;
		this.filters = {};
		this.wrapper = args['wrapper'];

		$('#myModal').remove();
		$('.modal').remove();
		$('.modal-backdrop').remove();;

		this.profile_id_setter()

		d = new Dialog();
		d.init({"file_name": args['file_name'], "title":"Provider Search", "button_title": "Add"})
		d.show()
		$('.modal-footer .btn-primary').css("float","left")
		$('<button class ="btn btn-success btn-sm" \
			style="background-color: #89c148;border-color: #89c148;color: #ffffff;float:left;"> Search </button>')
			.click(function(){
				$(".modal-body form input, .modal-body form select").each(function(i, obj) {
					me.filters[obj.name] = $(obj).val();
				})
				me.render_result_table(me.filters, d)
			})
			.appendTo($('.modal-body .panel'))
	},
	profile_id_setter:function(){
		if(frappe.get_cookie("user_type")=='provider'){
			this.profile_id = sessionStorage.getItem("pid");
		}
		else{
			this.profile_id = sessionStorage.getItem("cid");
		}
	},
	render_result_table:function(filters, d){
		var me = this;
		frappe.call({
			"method":"phr.templates.pages.event.get_providers",
			"args":{"filters":filters},
			callback:function(r){
				me.generate_table(r.message, d, filters)
			}
		})
	},
	generate_table: function(result_set, d, filters){
		var me = this;

		$('.stable').remove()
		$('.ap').remove()
		$('.hr').remove()
		if(result_set){
			$('.modal-footer .btn-primary').show();

			this.table = $("<hr class='hr'><div class='table-responsive stable' style='overflow-y: auto;height: 300px; margin-top: 10%;'>\
				<table class='table table-bordered'>\
					<thead><tr></tr></thead>\
					<tbody></tbody>\
				</table>\
			</div>").appendTo('.modal-body');

			header = [["", 50], ["Provider Type", 170],["Provider Name", 170], ["Number", 100], ["Email", 100], ["Specialization", 100], ["Location", 100]]

				$.each(header, function(i, col) {
				$("<th>").html(col[0]).css("width", col[1]+"px")
					.appendTo(me.table.find("thead tr"));
				});

			$.each(result_set, function(i,d){
				var row = $("<tr>").appendTo(me.table.find("tbody"));
				$('<td>').html('<input type="radio" name="provider" id = "'+d['provider_id']+'">').appendTo(row)
				$('<td>').html(d['provider_type']).appendTo(row)
				$('<td>').html(d['provider_name']).appendTo(row)
				$('<td>').html(d['mobile_number']).appendTo(row)
				$('<td>').html(d['email']).appendTo(row)
				$('<td>').html(d['specialization']).appendTo(row)
				$('<td>').html(d['addr']).appendTo(row)
			})
			me.set_provider(d)
		}
		else{
			$('<div class="stable" style="margin-top: 10%;">No Provider is there for selected criteria. \
				You can add New Provider by clicking on Add Button</div>').appendTo('.modal-body')
			$('.modal-footer .btn-primary').hide()
		}
		

		$('<button class ="btn btn-success btn-sm ap" style="float:left;"> Create New Provider </button>')
			.unbind("click").click(function(){
				d.hide()
				me.create_provider_linking(filters, d)
			})
			.appendTo($('.modal-footer'))
	},
	set_provider:function(d){
		var me = this;
		$('.modal-footer .btn-primary').unbind("click").click(function(){
			var flag = false;

			$('.modal-body .table').find('tr').each(function () {
				var row = $(this);
				console.log(row)
				var $td = $('td', row);
				if ($td.find('input[name="provider"]').is(':checked')) {
					flag = true;
					$('[name="doctor_id"]').val($td.find('input[name="provider"]').attr('id'))
					$('[name="doctor_name"]').val($($td[2]).html())
					$('[name="email_id"]').val($($td[4]).html())
					$('[name="number"]').val($($td[3]).html())
					me.check_existing($td.find('input[name="provider"]').attr('id'),$($td[4]).html(),$($td[3]).html(),$($td[2]).html(), $($td[1]).html(),d)
				}
			})
			if(flag){
				frappe.msgprint("First Select provider then click on Add")
			}
		})
	},
	check_existing:function(provider_id,email,mobile,name, provider_type, d){
		var me=this;
		frappe.call({
			method:"phr.templates.pages.provider.check_existing_provider",
			args:{'provider_id':provider_id, 'profile_id':me.profile_id},
			callback:function(r){
				// console.log(r.message)
				if (r.message!=true){
					me.attach_provider({'entityid':provider_id},
							{'email': email,'mobile': mobile,'name':name, 'provider_type': provider_type }, d)
				}
				else{
					d.hide();
					$('#myModal').remove();
					$('.modal').remove();
					$('.modal-backdrop').remove();
				}
			}
		})
	},
	attach_provider:function(res, data, d){
		var me = this;
		NProgress.start();
		frappe.call({
			method:"phr.templates.pages.provider.link_provider",
			args:{'res': res, 'data':data, 'profile_id':me.profile_id},
			callback:function(r){
				var db = new render_dashboard();
				db.render_providers(me.profile_id);
				me.get_linked_providers();
				NProgress.done();
				$('#myModal').remove();
				$('.modal').remove();
				$('.modal-backdrop').remove();
			}
		})
	},
	create_provider_linking:function(filters, d){
		var me = this;
		$('#myModal').remove();
		$('.modal').remove();
		$('.modal-backdrop').remove();

		d.init({"file_name":"provider", "values": filters, "title":"New Provider", "button_title": "Add"})
		$('.modal-footer .btn-primary').css("float","left")
		d.show()
		me.bind_provider_creation(d)
	},
	bind_provider_creation:function(d){
		var me = this;
		this.res = {}

		$('.modal-footer .btn-primary').click(function(){
			var validated=me.validate_form_model()
			if (validated['fg']==true){
				$(".modal-body form input, .modal-body form textarea, .modal-body form select").each(function(i, obj) {
					me.res[obj.name] = $(obj).val();
				})
				me.res["received_from"]="Desktop"
				me.res["provider"]=true
				me.create_provider(me.res, d)
			}
			else{
				frappe.msgprint(validated["msg"])
				return false
			}
		})
	},
	validate_form_model:function(){
		var fg=true
  		msg=""
		$(".modal-body form input[required],.modal-body form textarea[required],.modal-body form select[required]").each(function(i, obj) {
  			if ($(this).val()==""){
  				$(this).css({"border": "1px solid #999","border-color": "red" });
  				fg=false
  				msg="Fields Marked As red Are Mandatory"
  			}
  		})
  		return {
  			"fg":fg,
  			"msg":msg
  		}
	},
	create_provider: function(res, d){
		var me=this;
		NProgress.start();
		frappe.call({
			method: "phr.templates.pages.provider.create_provider",
			args:{'data':res, "profile_id": me.profile_id},
			callback:function(r){
				if(r.message.returncode==129){

					$('[name="doctor_id"]').val(r.message.entityid)
					$('[name="doctor_name"]').val(res.name)
					$('[name="email_id"]').val(res.email)
					$('[name="number"]').val(res.mobile)
					$('[name="provider_type"]').val(res.provider_type);

					var db = new render_dashboard();
					db.render_providers(me.profile_id);
					me.get_linked_providers()
					NProgress.done();

					$('#myModal').remove();
					$('.modal').remove();
					$('.modal-backdrop').remove();
				}
			}
		})
	},
	get_linked_providers:function(profile_id){
		var me = this;
		this.profile_id = profile_id ? profile_id : this.profile_id_setter();
		frappe.call({
			method:"phr.templates.pages.event.get_linked_providers",
			args:{'profile_id':me.profile_id},
			callback:function(r){
				console.log("test")
				var flag = false;
				$('[name="doctor_name"]').autocomplete({
					open: function(){
						setTimeout(function () {
							$('.ui-autocomplete').css('z-index', 99999999999999);
						}, 0);
					},
					source: r.message,
					multiselect: false,
					select: function( event, obj) {
						$('[name="email_id"]').val(obj['item']['email']);
						$('[name="number"]').val(obj['item']['mobile']);
						$('[name="doctor_id"]').val(obj['item']['provider']);
						$('[name="provider_type"]').val(obj['item']['provider_type']);
						flag = true;
					},
					change: function( event, ui ) {
						if(!flag) {
							$('[name="doctor_id"]').val("");
							$('[name="email_id"]').val("");
							$('[name="provider_type"]').val("");
						}
						flag = false;
					}
				})
			}
		})
	}
})