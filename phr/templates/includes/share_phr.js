frappe.provide("templates/includes");
frappe.provide("frappe");
frappe.require("assets/phr/pdfjs/build/pdf.js")

SharePhr = function(){
	this.wrapper = '';
}

$.extend(SharePhr.prototype,{
	init:function(wrapper, args){
		this.wrapper = wrapper;
		this.args = args;
		$(this.wrapper).empty();
		$('.field-area').empty();
		var me = this;
		this.selected_files = args['selected_files'];
		this.doc_list = args['doc_list'];
		RenderFormFields.prototype.init(this.wrapper, {'file_name':args['file_name'], 
			'values': args['values'], 'method': args['method']}, args['event_id']);
		$('.save_controller').remove();
		$('#share').click(function(){
			me.share_phr();
		});
		this.bind_controller();
		this.render_folder_section(args['event_id'],args['method']);
		this.get_event_details();
		console.log()
		Events.prototype.write_visit_file(this.event_tag_id, this.profile_id, this.visit_tag_id);
		$("#provider_name").click(function(){
			ProviderOperations.prototype.dialog_oprations({'file_name':"provider_search", "wrapper":this.wrapper})
		});
		ProviderOperations.prototype.get_linked_providers(this.args['profile_id']);
	},
	bind_controller: function(){
		var me = this;
		$('form input[name="sharing_duration"]').bind('change', function() { 
			val=$(this).val();
			if (diffDays(parseDate(val),new Date().setHours(0,0,0,0)) > 0) { 
				$(this).val("");
    			frappe.msgprint("Sharing Duration date should not be less than Current Date");
			}
		});

		if(me.selected_files.length > 1){
			me.select_all_docs(me.args['event_id'], me.args['method'])
		}

		$('form select[name="share_via"]').bind('change', function(){
			if($(this).val() == 'Provider Account'){
				me.select_all_docs()
				frappe.msgprint("All Files has been selected for sharing")
			}
			else{
				if(!me.selected_files.length > 1){
					me.doc_list = [];
					me.render_folder_section(me.args['event_id'], me.args['method'])
					frappe.msgprint("Please select files First then move with sharing")		
				}
			}
		})
	},
	get_event_details:function(){
		var me = this;
		entityid = $('form input[name="entityid"]').val();
		event_id = $('form input[name="event_id"]').val();

		this.profile_id = this.args['profile_id'];
		this.event_tag_id = event_id ? event_id : entityid;
		this.visit_tag_id = event_id ? entityid : null;
	},
	select_all_docs: function(){
		var me = this;

		event_data = {
			"sharelist": [{
				"from_profile_id": me.profile_id, 
				"event_tag_id": me.event_tag_id,
            	"visit_tag_id": me.visit_tag_id 
			}]	
		}
		frappe.call({
			"method":"phr.templates.pages.event.marked_files_doc",
			"args":{"event_data": event_data, "data": {}, "selected_files": me.selected_files},
			callback:function(r){
				me.doc_list = r.message;
				me.render_folder_section(me.args['event_id'], me.args['method'])
			}
		})
	},
	render_folder_section:function(event_id,method){
		var me = this;
		if (method=="visit"){
			frappe.call({
				"method":"phr.templates.pages.event.get_individual_visit_count_for_badges",
				"args":{"visit_id": $('input[name="entityid"]').val(),"profile_id": me.args['profile_id']},
				callback:function(r){
					TreeView.prototype.init({'profile_id': me.args['profile_id'], 'dms_file_list': me.dms_file_list, 
						'display': 'initial', 'doc_list': me.doc_list,"event_dict":r.message.event_dict,"sub_event_count":r.message.sub_event_count})
				}
			})
		}
		else{
			frappe.call({
				"method":"phr.templates.pages.event.get_individual_event_count_for_badges",
				"args":{"event_id":event_id,"profile_id": me.args['profile_id']},
				callback:function(r){
					TreeView.prototype.init({'profile_id': me.args['profile_id'], 'dms_file_list': me.dms_file_list, 
						'display': 'initial', 'doc_list': me.doc_list,"event_dict":r.message.event_dict,"sub_event_count":r.message.sub_event_count})
				}
			})
		}
	},
	bind_sub_section_events: function(){
		var me = this;
		$('#A_51, #B_52, #C_53').bind('click',function(){
				$("#sharetab").remove();
				$(repl_str("<li class='active'>%(parent)s</li><li class=active'>%(id)s</li>\
					",{'id':$(this).attr('id'), 'parent':$(this).parent().attr('id')})).appendTo('.breadcrumb');
				me.sub_folder = $(this).attr('id');
				me.folder = $(this).parent().attr('id')
				ThumbNails.prototype.init(me.wrapper, {'folder':me.folder, 
						'sub_folder':me.sub_folder, 'profile_id':me.args['profile_id'], 
						'display':'initial', 'doc_list': me.doc_list})
			})	
	},
	share_phr:function(){
		var me = this;
		var uniqueNames = [];
		me.res = {}

		if(me.doc_list){
			$.each(me.doc_list, function(i, el){
				if($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
			});
	
		}
		$("form input, form textarea, form select").each(function(i, obj) {
			me.res[obj.name] = $(obj).val();
		})

		me.res['files'] = uniqueNames;
		me.res['profile_id'] = me.args['profile_id'];
		me.res['folder'] = me.folder;
		me.res['sub_folder'] = me.sub_folder;
		me.res['lphr_name'] = sessionStorage.getItem("cname")

		if(me.validate_form()){
			NProgress.start();
			frappe.call({
				method:"phr.templates.pages.event.send_shared_data",
				args:{"data":me.res},
				callback:function(r){
					NProgress.done();
					frappe.msgprint(r.message.message_summary)
					if (r.message.returncode != 0){
						me.notify_provider(me.res,r.message)	
					}
				}
			})
		}
	},
	notify_provider:function(data,res){
		frappe.call({
			method:"phr.templates.pages.event.build_provider_notification",
			args:{"res":data},
			callback:function(r){
			}
		})
	},
	validate_form:function(){
  		var me=this;
  		var fg=true
  		$("form input[required], form textarea[required], form select[required]").each(function(i, obj) {
  			if ($(this).val()=="" && $(this).is(':visible')){
  				$(this).css({"border": "1px solid #999","border-color": "red" });
  				fg=false
  			}
  		})
  		if(fg){
  			if($("form select[name='share_via']").val() == 'Provider Account' && (!$("form input[name='doctor_name']").val() || $("form input[name='doctor_id']").val() == '')){
  				frappe.msgprint("Please select a provider first then procees with sharing")
  				fg=false
  			}

  			if($("form select[name='share_via']").val() == 'Email' && !$("form input[name='email_id']").val()){
  				frappe.msgprint("Please mention Provider's Email Id")
  				fg=false	
  			}
  			if($("form select[name='share_via']").val() == 'Provider Account' && !$("form input[name='sharing_duration']").val()){
  				frappe.msgprint("Please mention sharing duration")
  				fg=false	
  			}
  			if(me.doc_list.length === 0){
  				frappe.msgprint("Please select files for sharing")
  				fg=false
  			}
  		}
  		else{
  			frappe.msgprint("Field(s) Marked as Red Are Mandatory")
  		} 
  		return fg
  	}
})