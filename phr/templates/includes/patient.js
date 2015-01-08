frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
// {% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list_view.js" %}
{% include "templates/includes/list.js" %}


$(document).ready(function () {
	$("#profile").unbind("click").click(function(){
		PatientDashboard.prototype.init($(document).find("#main-con"),"profile")
	})
	$('.event').unbind("click").click(function(){
		Event.prototype.init($(document).find("#main-con"))
	})
	$(".create_linkphr").unbind("click").click(function(){
		PatientDashboard.prototype.init($(document).find("#main-con"),"linked_patient")
	})
})

var PatientDashboard = inherit(RenderFormFields, {
	init: function(wrapper,cmd){
		this.wrapper = wrapper;
		this.args=cmd
		RenderFormFields.prototype.init(this.wrapper,this.args)
		this.render_field()
	},
	render_field: function(){
		// $('<button type="button" class="btn btn-default" aria-label="Left Align">Save</button>')
		// .appendTo($('.form-controller'))	
		// .click(function(){
		// 	var res = {};
		// 	$(".tab-pane.active form input, .tab-pane.active form textarea, .tab-pane.active form select").each(function(i, obj) {
		// 		res[obj.name] = $(obj).val();
		// 	})

		// })
	}

})


var Event = inherit(ListView,{
	init: function(wrapper){
		this.wrapper = wrapper;

		ListView.prototype.init(this.wrapper, {'fields':[
						{'fieldname':'event_date','fieldtype':'date','label':'Event Date'},
						{'fieldname':'event','fieldtype':'link','label':'Event','options':['Dengue','Headache','Chest Pain']},
						{'fieldname':'description','fieldtype':'text','label':'Description'},
						{'fieldname':'provider_type','fieldtype':'select','label':'Healthcare Provider', 'options':['Doc', 'Hospital', 'Lab']},
						{'fieldname':'','fieldtype':'column_break','label':''},
						{'fieldname':'provider_name','fieldtype':'data','label':'Provider Name'},
						{'fieldname':'number','fieldtype':'data','label':'Contact Number'},
						{'fieldname':'email_id','fieldtype':'data','label':'Email Id'}
					]})
		this.render_spans()
	},
	render_spans: function(){
		var me = this;

		$('.new_controller').bind('click',function(event) {
			me.bind_save_event()			
		})
		
		// $('<button type="button" class="btn btn-default" aria-label="Left Align">')
		// .appendTo($(this.wrapper))	
		// .click(function(){
		// 	var res = {};
		// 	$("form input").each(function(i, obj) {
		// 		res[obj.name] = $(obj).val();
		// 	})
		// 	console.log(res)
		// 	// console.log($('form').serialize())
		// })
	},
	bind_save_event: function(){
		var me = this;

		$('.save_controller').bind('click',function(event) {
			frappe.call({
				method:"phr.templates.pages.event.create_event",
				args:{"data":JSON.stringify(me.result_set)},
				callback:function(r){
					// console.log(r)
					$('<div class="event_section"></div>').appendTo($('.field-area'))
					me.render_folder_section()
	  				me.bind_events()
				}
			})
						
		})
		
	},
	render_folder_section: function(){
		$('<div class="event_section1" style = "margin:10%; 10%;">\
			<div class="btn btn-success" id = "consultancy" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
				<i class="icon-folder-close-alt icon-large"></i> <br> Consultancy\
			</div>\
			<div class="btn btn-success" id = "event_snap" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
				<i class="icon-folder-close-alt icon-large"></i> <br> Event Snaps \
			</div>\
			<div class="btn btn-success" id = "lab_reports" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
				<i class="icon-folder-close-alt icon-large"></i> <br> Lab Reports \
			</div>\
		</div>\
		<div class="event_section2" style="margin:10%; 10%;">\
			<div class="btn btn-success" id = "prescription" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
				<i class="icon-folder-close-alt icon-large"></i>  <br> Prescription \
			</div>\
			<div class="btn btn-success" id = "cost_of_care" \
				style = "margin:5%; 5%;height:80px;text-align: center !important;">\
				<i class="icon-folder-close-alt icon-large"></i>  <br> Cost of Care \
			</div>\
		</div>\
	    ').appendTo($('.event_section'))
	},
	bind_events: function(){
		var me = this;
		$('#consultancy, #event_snap, #lab_reports, #prescription, #cost_of_care')
			.bind('click',function(){
				$('.breadcrumb').empty();

				$(repl_str("<a href='#'>Event</a>\
						<a href='#' class='active'>%(id)s</a>\
					",{'id':$(this).attr('id')})).appendTo('.breadcrumb');

				$('.event_section').empty();
				
				me.render_sub_sections()
			})
	},
	render_sub_sections: function(){
		var me = this;
		$('<div class="event_sub_section" style = "margin:10%; 10%;">\
				<div class="btn btn-success" id = "A" \
					style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
					<i class="icon-folder-close-alt icon-large"></i> <br> A\
				</div>\
				<div class="btn btn-success" id = "B" \
					style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
					<i class="icon-folder-close-alt icon-large"></i> <br> B \
				</div>\
				<div class="btn btn-success" id = "C" \
					style = "margin:5%; 5%;height:80px;text-align: center !important;"> \
					<i class="icon-folder-close-alt icon-large"></i> <br> C \
				</div>\
			</div>\
		').appendTo($('.event_section'));
		me.bind_sub_section_events()
	},
	bind_sub_section_events: function(){
		var me = this;
		$('#A, #B, #C').bind('click',function(){
				$(".breadCrumb a").last().remove();
				$(repl_str("<a href='#' class='active'>%(id)s</a>\
					",{'id':$(this).attr('id')})).appendTo('.breadcrumb');
				$('.uploader').empty()
				me.render_uploader_and_files()
			})	
	},
	render_uploader_and_files:function(){
		var me = this;
		$('<div class="uploader"><div id="uploaded_file">\
				<h4> Uploaded Files </h4>\
			</div>\
			<hr><br>\
			<div>\
				<h4> Uploaded Files </h4>\
				<div id="attach"> Attach </div>\
			</div>\
			<button id="share_data">Share Data</button></div>').appendTo($('.field-area'))
		
		$('#share_data').click(function(){
			me.get_selected_files()
		})

		this.show_attachments()

		upload.make({
			parent: $('#attach'),
			callback:function(attachment, r) {
				me.attachment_uploaded(attachment, r);
			},
			onerror: function() {
				
			},
		});
	},
	show_attachments:function(){
		var me = this;
		frappe.call({
			method:"phr.templates.pages.event.get_attachments",
			args:{'profile_id':'123456789'},
			callback:function(r){
				// console.log(r.message)
				me.create_attachement_renderer(r.message)
			}
		})
	},
	create_attachement_renderer: function(attachments){
		var me = this;
		this.table = $('<table></table>').appendTo('#uploaded_file');

		row = $('<tr>').appendTo(this.table)
		$.each(attachments, function(i, attachment){
			if((i+1)%4 == 0){
				row = $('<tr>').appendTo(me.table)
			}
			me.render_attachemnt(attachment, row)
		})
	},
	render_attachemnt:function(attachment, row){
		if(attachment['type'] == 'pdf' || attachment['type'] == 'PDF'){
			$td = $(repl('<td style="width:200px;\
							height:200px;padding-right:20px;">\
						<div>\
							<input type="checkbox"  value="%(file_name)s">\
						</div>',attachment)).appendTo(row)
			thumbnail("/files/"+attachment['file_name'], $td)
		}
		if((/\.(gif|jpg|jpeg|tiff|png)$/i).test(attachment['file_name']) ){
			$('<td style="width:200px;height:200px;padding-right:20px;">')
				.html($(repl('<div>\
						<input type="checkbox"  value="%(file_name)s">\
					</div>\
					<img src="/files/%(file_name)s">\
					<br><label>%(file_name)s</label>',attachment))).appendTo(row)
		}		
	},
	get_selected_files: function(){
		var me = this;
		var selected_files = []
		$(this.table).find('tr').each(function () {
			var row = $(this);
			$('td', row).map(function(index, td) {
			    if ($(td).find('input[type="checkbox"]').is(':checked')) {
					selected_files.push($(td).find('input[type="checkbox"]').val())
				}
			});
		})
		console.log(selected_files)	
	}

})


upload = {
	make: function(opts) {
		if(!opts.args) opts.args = {};
		var $upload = $('<div class="file-upload">\
			<p class="small"><a class="action-attach disabled" href="#"><i class="icon-upload"></i> '
				+ __('Upload a file') + '</a> | <a class="action-link" href="#"><i class="icon-link"></i> '
				 + __('Attach as web link') + '</a></p>\
			<div class="action-attach-input">\
				<input class="alert alert-info" style="padding: 7px; margin: 7px 0px;" \
					type="file" name="filedata" />\
			</div>\
			<div class="action-link-input" style="display: none; margin-top: 7px;">\
				<input class="form-control" style="max-width: 300px;" type="text" name="file_url" />\
				<p class="text-muted">'
					+ (opts.sample_url || 'e.g. http://example.com/somefile.png') +
				'</p>\
			</div>\
			<button class="btn btn-info btn-upload"><i class="icon-upload"></i> ' +__('Upload')
				+'</button></div>').appendTo(opts.parent);


		$upload.find(".action-link").click(function() {
			$upload.find(".action-attach").removeClass("disabled");
			$upload.find(".action-link").addClass("disabled");
			$upload.find(".action-attach-input").toggle(false);
			$upload.find(".action-link-input").toggle(true);
			$upload.find(".btn-upload").html('<i class="icon-link"></i> ' +__('Set Link'))
			return false;
		})

		$upload.find(".action-attach").click(function() {
			$upload.find(".action-link").removeClass("disabled");
			$upload.find(".action-attach").addClass("disabled");
			$upload.find(".action-link-input").toggle(false);
			$upload.find(".action-attach-input").toggle(true);
			$upload.find(".btn-upload").html('<i class="icon-upload"></i> ' +__('Upload'))
			return false;
		})

		// get the first file
		$upload.find(".btn-upload").click(function() {
			// convert functions to values

			for(key in opts.args) {
				if(typeof val==="function")
					opt.args[key] = opts.args[key]();
			}

			// add other inputs in the div as arguments
			opts.args.params = {};
			$upload.find("input[name]").each(function() {
				var key = $(this).attr("name");
				var type = $(this).attr("type");
				if(key!="filedata" && key!="file_url") {
					if(type === "checkbox") {
						opts.args.params[key] = $(this).is(":checked");
					} else {
						opts.args.params[key] = $(this).val();
					}
				}
			})

			opts.args.file_url = $upload.find('[name="file_url"]').val();

			var fileobj = $upload.find(":file").get(0).files[0];
			upload.upload_file(fileobj, opts.args, opts);
		})
	},
	upload_file: function(fileobj, args, opts) {
		if(!fileobj && !args.file_url) {
			msgprint(__("Please attach a file or set a URL"));
			return;
		}

		var dataurl = null;
		var _upload_file = function() {
			if(opts.on_attach) {
				opts.on_attach(args, dataurl)
			} else {
				var msgbox = frappe.msgprint(__("Uploading..."));
				return frappe.call({
					"method": "phr.templates.pages.uploader.upload",
					args: args,
					callback: function(r) {
						if(!r._server_messages)
							msgbox.hide();
						if(r.exc) {
							// if no onerror, assume callback will handle errors
							opts.onerror ? opts.onerror(r) : opts.callback(null, null, r);
							return;
						}
						var attachment = r.message;
						opts.callback(attachment, r);
						$(document).trigger("upload_complete", attachment);
					}
				});
			}
		}

		

		if(args.file_url) {
			_upload_file();
		} else {
			var freader = new FileReader();

			freader.onload = function() {
				args.filename = fileobj.name;
				// _upload_file();
				// if((opts.max_width || opts.max_height) && (/\.(gif|jpg|jpeg|tiff|png)$/i).test(args.filename)) {
				// 	frappe.utils.resize_image(freader, function(_dataurl) {
				// 		dataurl = _dataurl;
				// 		args.filedata = _dataurl.split(",")[1];
				// 		console.log("resized!")
				// 		_upload_file();
				// 	})
				// } 
				// else {
					dataurl = freader.result;
					args.filedata = freader.result.split(",")[1];
					_upload_file();
				// }
			};

			freader.readAsDataURL(fileobj);
		}
	}
}