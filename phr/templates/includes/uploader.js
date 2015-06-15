

upload = {
	make: function(opts) {
		if(!opts.args) opts.args = {};
		var $upload = $('<div class="file-upload">\
			<p class="small"><a class="action-attach disabled" href="#"><i class="icon-upload"></i> '
				+ __('Upload a file') + '</a></p>\
			<div class="action-attach-input">\
				<input class="alert alert-info" style="max-width: 100%; padding: 7px; margin: 7px 0px;" \
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

			var $modal = $("#myModal").detach().modal();
			$modal.modal("hide");
			$modal.modal("destroy").remove();
		})
	},
	upload_file: function(fileobj, args, opts) {
		NProgress.start();
		
		if(!fileobj && !args.file_url) {
			frappe.msgprint(__("Please attach a file"));
			NProgress.done();
			return;
		}
		// args["dialog"].hide();

		delete args["dialog"];

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
						if(!r._server_messages){
							msgbox.hide();
							$('.modal').remove()
							$('.modal-backdrop').remove()
							frappe.msgprint(r.message['success_meg'])
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
				dataurl = freader.result;
				args.filedata = freader.result.split(",")[1];
				_upload_file();

			};

			freader.readAsDataURL(fileobj);
		}
	}
}