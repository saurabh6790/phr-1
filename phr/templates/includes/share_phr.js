frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
// {% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}
{% include "templates/includes/treeview.js" %}


SharePhr = function(){
	this.wrapper = '';
}

$.extend(SharePhr.prototype,{
	init:function(wrapper, args){
		this.wrapper = wrapper;
		this.args = args;
		$(this.wrapper).empty()
		$('.field-area').empty()
		var me = this;
		this.selected_files = args['selected_files']
		this.doc_list = args.doc_list;
		RenderFormFields.prototype.init(this.wrapper, {'file_name':args['file_name'], 
			'values': args['values'], 'method': args['method']}, args['event_id'])

		$('<button id="share_data" class="btn btn-primary">Share Data</button></div>').appendTo($('.field-area'))
		$('<div class="event_section"></div>').appendTo($('.field-area'))
		$('#share_data').click(function(){
			me.share_phr();
		})
		this.bind_controller()
		//console.log(["ss",me.args['event_id']])
		this.render_folder_section(args['event_id'],args['method'])
		Events.prototype.get_linked_providers(this.args['profile_id'])
	},
	bind_controller: function(){
		var me = this;
		$('form input[name="sharing_duration"]').bind('change', function() { 
			val=$(this).val()
			if (diffDays(parseDate(val),new Date().setHours(0,0,0,0)) >= 0) { 
				$(this).val("")
    			frappe.msgprint("Sharing Duration date should not be less or equal than Current Date")
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
	select_all_docs: function(){
		var me = this;
		entityid = $('form input[name="entityid"]').val();
		event_id = $('form input[name="event_id"]').val();

		profile_id = this.args['profile_id'];
		event_tag_id = event_id ? event_id : entityid;
		visit_tag_id = event_id ? entityid : null;

		event_data = {
			"sharelist": [{
				"from_profile_id": profile_id, 
				"event_tag_id": event_tag_id,
            	"visit_tag_id": visit_tag_id 
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
		console.log([method, me.args['profile_id'], $('input[name="entityid"]').val()])
		//method=""
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
		
		
		// $("<div class='main' id='sharetab'></div>").appendTo($('.event_section'))
		
		// folders = ['consultancy-11', 'event_snap-12', 'lab_reports-13', 'prescription-14', 'cost_of_care-15']

		// me.mapper = {'consultancy-11':[{'label' : 'DOCTORS  CLINICAL NOTES', 'id':'A_51'}, 
		// 							{'label' : 'TEST / INVESTIGATION ADVISED', 'id': 'B_52'}, 
		// 							{'label' : 'REFERAL NOTE', 'id': 'C_53'}],
		// 			'event_snap-12':[{'label' : 'PATIENT SNAPS', 'id' : 'A_51'},
		// 					{'label':'CLINICAL SNAPS', 'id': 'B_52'}],
		// 			'lab_reports-13':[{'label': 'TEST REPORTS', 'id':'A_51'}, 
		// 					{'label':'TEST IMAGES', 'id':'B_52'}],
		// 			'prescription-14':[{'label':'PRESCRIBED MEDICATION', 'id':'A_51'},
		// 					{'label':'PRISCRIBED ADVICE','id':'B_52'},
		// 					{'label':'DISCHARGE SUMMERY', 'id': 'C_53'}],
		// 			'cost_of_care-15':[{'label': 'MEDICAL BILLS', 'id': 'A_51'}]
		// 		}

		// $('#sharetab').empty()

		// if(this.args['selected_files']){
		// 	folders = $.arrayIntersect(folders, this.args['selected_files'])
		// }
		// $.each(folders, function(i, folder){
		// 	$(repl_str('<div id = "%(id)s">\
		// 					<div style = "display:inline-block;margin:5%; 5%;height:80px;text-align: center !important;"> \
		//  						<i class="icon-folder-close-alt icon-large"></i> %(id)s <br> \
		//  					</div>\
		// 			</div>',{'id':folder})).appendTo(i==0?$('#sharetab'):$("#"+folders[i-1]))	
		// 	$.each(me.mapper[folder], function(j, sub_folder){
		// 		$(repl_str('<div class="btn btn-success" id = "%(id)s" \
		// 	 			style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
		// 	 			<i class="icon-folder-close-alt icon-large"></i> <br> %(label)s\
		// 	 		</div>', sub_folder)).appendTo('#'+folder);
		// 	})
		// 	$(repl_str('<div id = "%(id)s">\
		// 		<div style = "display:inline-block;margin:5%; 5%;height:80px;text-align: center !important;"> \
		//  			<i class="icon-folder-close-alt icon-large"></i> %(id)s <br> \
		//  		</div>\
		//  		<div class="btn btn-success" id = "A" \
		//  			style = "display:inline-block;margin:5%; 5%;height:80px;text-align: center !important;"> \
		//  			<i class="icon-folder-close-alt icon-large"></i> <br> A\
		//  		</div>\
		//  		<div class="btn btn-success" id = "B" \
		//  			style = "display:inline-block;margin:5%; 5%;height:80px;text-align: center !important;"> \
		//  			<i class="icon-folder-close-alt icon-large"></i> <br> B\
		//  		</div>\
		// 		<div class="btn btn-success" id = "B" \
		//  			style = "display:inline-block;margin:5%; 5%;height:80px;text-align: center !important;"> \
		//  			<i class="icon-folder-close-alt icon-large"></i> <br> C\
		//  		</div>\
		//  		</div>', {'id':folder})).appendTo(i==0?$('#sharetab'):$("#"+folders[i-1]))
		// })		
		// this.bind_sub_section_events()
	},
	bind_sub_section_events: function(){
		var me = this;
		$('#A_51, #B_52, #C_53').bind('click',function(){
				$("#sharetab").remove();
				$(repl_str("<li class='active'>%(parent)s</li><li class=active'>%(id)s</li>\
					",{'id':$(this).attr('id'), 'parent':$(this).parent().attr('id')})).appendTo('.breadcrumb');
				// $('.sharetab').empty();
				me.sub_folder = $(this).attr('id');
				me.folder = $(this).parent().attr('id')
				ThumbNails.prototype.init(me.wrapper, {'folder':me.folder, 
						'sub_folder':me.sub_folder, 'profile_id':me.args['profile_id'], 
						'display':'initial', 'doc_list': me.doc_list})
				// me.render_uploader_and_files();
			})	
	},
	share_phr:function(){
		var me = this;
		var uniqueNames = [];
		me.res = {}

		if(me.doc_list){
			// console.log(me.doc_list)
			$.each(me.doc_list, function(i, el){
				if($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
			});
	
		}
		// console.log(uniqueNames)
		$("form input, form textarea, form select").each(function(i, obj) {
			me.res[obj.name] = $(obj).val();
		})

		me.res['files'] = uniqueNames;
		me.res['profile_id'] = me.args['profile_id'];
		me.res['folder'] = me.folder;
		me.res['sub_folder'] = me.sub_folder;
		me.res['lphr_name'] = sessionStorage.getItem("cname")

		// console.log(me.res)
		if(me.validate_form()){
			NProgress.start();
			frappe.call({
				method:"phr.templates.pages.event.send_shared_data",
				args:{"data":me.res},
				callback:function(r){
					NProgress.done();
					frappe.msgprint(r.message)
				}
			})
		}
	},
	validate_form:function(){
  		var me=this;
  		var fg=true
  		$("form input[required], form textarea[required], form select[required]").each(function(i, obj) {
  			if ($(this).val()=="" && $(this).is(':visible')){
  				$(this).css({"border": "1px solid #999","border-color": "red" });
  				frappe.msgprint("Fields Marked as Red Are Mandatory")
  				fg=false
  			}
  		})
  		if(fg){
  			if(!$("form input[name='doctor_name']").val() || $("form input[name='doctor_id']").val() == ''){
  				frappe.msgprint("Please Select Appropriate Provider")
  				fg=false
  			}

  			if($("form select[name='share_via']").val() == 'Email' && !$("form input[name='email_id']").val()){
  				frappe.msgprint("Please mention Provider's Email Id")
  				fg=false	
  			}
  		} 
  		return fg
  	}
})