frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
// {% include "templates/includes/form_generator.js" %}
{% include "templates/includes/list.js" %}
{% include "templates/includes/uploader.js" %}
{% include "templates/includes/custom_dialog.js" %}

var ThumbNails = function(){
	this.wrapper = ""
}

$.extend(ThumbNails.prototype,{
	init :function(wrapper, arg){
		this.wrapper = wrapper;
		this.args = arg;
		this.doc_list = arg['doc_list']
		this.folder = arg['folder'];
		this.sub_folder = arg['sub_folder'];
		this.uploader_display = arg['display'] == 'initial'? 'none':'initial';
		this.render_uploader_and_files()
	},
	render_uploader_and_files:function(){
		var me = this;
		$('.thumb').empty();
		$('.uploader').empty();
		$(repl_str('<div class="uploader">\
			<br>\
			<div  style="display:%(uploader_display)s">\
				<button style="float:left;width:30%;" id="img" class="btn btn-primary" > \
					<i class="icon-upload"></i>\
					Upload Image </button>\
				<button style="float:left;width:30%;margin-left:5%;" id="descr" class="btn btn-primary" > \
					<i class="icon-file-text-alt"></i>\
					Write Description </button>\
				<button style="float:left;width:30%;margin-left:5%;" id="cp_img" class="btn btn-default" > \
					<i class="icon-camera" data-toggle="tooltip" data-placement="top" title="Comming Soon...."></i>\
					Capture Image </button>\
			</div>\
			<hr>\
			<h4> Uploaded Files </h4>\
			<div id="uploaded_file" style="height:500px;overflow-x:auto;background-color:#F5F5F5;">\
			</div>\
			',{'uploader_display':me.uploader_display})).appendTo($('.thumb'))
		
		// this.d.show()
		$('#desc').hide('fast');
		
		$("#descr").on("click",function(){
				$('#myModal').remove()
				$('.modal').remove()

				d = new Dialog();
				d.init({"title":"File Uploader/ Writer"})
				d.show();
				
				$('.modal-dialog').removeClass('modal-sm').addClass('modal-lg');
				$('.modal-body').empty();
				$('.modal-footer .btn-primary').hide();
				
				$('	<div class="form-group row" style="display: block;margin-right:2%;" id="desc">\
					<div class="col-xs-12">\
						<div class="control-input">\
							<textarea type="text" class="form-control" \
								placeholder="Don\'t have an image, write a description. This will be saved below as pdf." name="attch_desc"\
								aria-describedby="basic-addon2" style="height:150px;"></textarea>\
						</div>\
					</div>\
					<button style="float:left;width:30%;margin-left:5%;margin-top:5%;" id="pdf_maker" class="btn btn-primary" > \
						<i class="icon-book"></i>\
						Save as PDF </button>\
				</div>\
				').appendTo('.modal-body');

				console.log($('#pdf_maker'));

				$('#myModal #pdf_maker').click(function(){
					console.log('trigger pdf pdf_maker')
					me.convert_txt_to_pdf($('[name="attch_desc"]').val())
				})
					
				$('#attach').hide('fast');
				$('#desc').show('fast');
			
		})

		$('#img').on("click", function(){
				$('#myModal').remove()
				$('.modal').remove()

				d = new Dialog();
				d.init({"title":"File Uploader/ Writer"})
				d.show()
				
				$('.modal-dialog').removeClass('modal-lg').addClass('modal-sm');
				$('.modal-body').empty();
				$('.modal-footer .btn-primary').hide();
				$('#desc').hide('fast');
				me.make_image_uploader(d)
				// $('#attach').show('fast');
			
		})

		this.show_attachments();
	},
	make_image_uploader:function(d){
		var me =this;
		console.log($('input[name="entityid"]').val())
		upload.make({
			parent: $('.modal-body'),
			args:{'profile_id': me.args['profile_id'], 'folder':me.folder, 
				'sub_folder': me.sub_folder, 'event_id': $('input[name="entityid"]').val(), 'dialog': d},
			callback:function(attachment, r) {
				NProgress.done();
				me.args['dms_file_list'] = me.args['dms_file_list'] ? me.args['dms_file_list'] : [];
				me.args['dms_file_list'].push({
						"tag_id": me.folder.split('-')[1]+''+me.sub_folder.split('_')[1],
						"tag_name": me.folder.split('-')[0],
	            		"sub_tag_name": me.sub_folder.split('_')[0],
	            		"file_id": [
							attachment['file_name']
						],
	            		"file_location": [
	            			attachment['site_path'] +'/'+ me.args['profile_id'] + '/' +  $('input[name="entityid"]').val() + '/' + me.folder + '/' +  me.sub_folder + '/' + attachment['file_name']
						],
						"text_file_desc":  "" ,
						"text_file_id":  "",
						"text_file_loc": ""
				})
				me.render_uploader_and_files();
			}
		});
	},
	convert_txt_to_pdf:function(desc){
		var me = this;
		console.log($('[name="attch_desc"]').val())
		if($('[name="attch_desc"]').val()){
			frappe.call({
				method:"phr.templates.pages.uploader.get_pdf_site_path",
				args:{'profile_id': me.args['profile_id'], 'folder':me.folder, 
				'sub_folder': me.sub_folder, 'event_id': $('input[name="entityid"]').val(), 'timestamp' : String(new Date().getTime())},
				callback:function(r){
					me.args['dms_file_list'] = me.args['dms_file_list'] ? me.args['dms_file_list'] : [];
					me.args['dms_file_list'].push(			{
						"tag_id": me.folder.split('-')[1]+''+me.sub_folder.split('_')[1],
						"tag_name": me.folder.split('-')[0],
			    		"sub_tag_name": me.sub_folder.split('_')[0],
			    		"file_id": [],
			    		"file_location": [],
						"text_file_desc": $('[name="attch_desc"]').val() ? $('[name="attch_desc"]').val() : "" ,
						"text_file_id": $('[name="attch_desc"]').val() ? r.message['timestamp']+'_'+ me.folder+'_'+me.sub_folder+'.pdf' : "",
						"text_file_loc": $('[name="attch_desc"]').val() ? r.message['site_path'] +'/'+ me.args['profile_id'] + '/' +  $('input[name="entityid"]').val() + '/' + me.folder + '/' +  me.sub_folder + '/' + r.message['timestamp']+'_'+ me.folder+'_'+me.sub_folder+'.pdf' : ""
					})
				
					var $modal = $("#myModal").detach().modal();
					$modal.modal("hide");
					$modal.modal("destroy").remove();
					
					frappe.msgprint("Description added as pdf, click on save to make it as attachment")
					$('[name="attch_desc"]').val('')
				}
			})
		}
		else{
			frappe.msgprint("Please write description before converting it as pdf!!!")
		}
			
	},
	show_attachments:function(){
		var me = this;
		console.log(['show_attachments', me.args['req_id']])
		frappe.call({
			method:"phr.templates.pages.event.get_attachments",
			args:{'profile_id': sessionStorage.getItem("cid"), 'folder':me.folder, 
				'sub_folder': me.sub_folder, 
				'event_id': $('input[name="event_id"]').val() ? $('input[name="event_id"]').val() : $('input[name="entityid"]').val(),
				'visit_id': $('input[name="event_id"]').val() ? $('input[name="entityid"]').val() : '',
				'req_id': me.args['req_id']},
			callback:function(r){
				me.create_attachement_renderer(r.message)
			}
		})
	},
	create_attachement_renderer: function(attachments){
		var me = this;
		this.table = $('<table></table>').appendTo('#uploaded_file');

		row = $('<tr>').appendTo(this.table)
		$.each(attachments, function(i, attachment){
			if((i+1)%3 == 0){
				row = $('<tr>').appendTo(me.table)
			}
			attachment['display'] = me.args['display'];
			me.render_attachemnt(attachment, row)
		})
		this.image_gallery(attachments)
	},
	render_attachemnt:function(attachment, row){
		var me = this;
		if(attachment['type'] == 'pdf' || attachment['type'] == 'PDF'){
			$td = $(repl('<td style="width:200px;\
							height:200px;padding-right:20px;vertical-align:top;padding-left:5%;padding-top:5%;">\
						',attachment)).appendTo(row)
			console.log(me.doc_list)
			thumbnail("/"+attachment['path']+"/"+attachment['file_name'], $td, attachment['file_name'], me.doc_list, me.args['display'])
		}
		else if((/\.(gif|jpg|jpeg|tiff|png)$/i).test(attachment['file_name']) ){
			$('<td style="width:200px;height:200px;padding-right:20px;vertical-align:top;padding-left:5%;padding-top:5%;">')
				.html($(repl('<div>\
						<input type="checkbox" name="image" style="display:%(display)s" value="/%(path)s/%(file_name)s" >\
					</div>\
					<a nohref class="control-image" data-name="/%(path)s/%(file_name)s"><img class="img-responsive"  style="height:150px;" \
					src="/%(path)s/%(file_name)s" data-bigimgsrc="/%(path)s/%(file_name)s">\
					<br><label style="width: 150px;word-wrap: break-word;color: #009906;">%(file_name)s</label></a>',attachment))).appendTo(row)
		}

		if(me.doc_list){
			$.each(me.doc_list, function(i, val){
				$("input[value='/files/"+val+"']").prop('checked', true);
			})	
		}

		$('.control-image').unbind("click").click(function() {
			var title=$('input[name=event_title]').val()+' '+$('input[name=event_date]').val() || ''
			val=$(this).attr('data-name')
			d = new Dialog();
			d.init({"title":"Image Preview"+' ('+title+')'})
			d.show();
			$('.modal-footer .btn-primary').hide();
			$('<div><img style="position: relative; width: 100%; height: 60%; top: 10px" src="'+val+'">\
				<p style="position: absolute; top: 100px; left: 10%; width: 80%; padding: 4px; background-color: transparent; font-weight: bold; color: #0AD5F5; font-weight: 600; font-size: 2em;">\
				'+title+'</p></div>').appendTo($('.modal-body'))
		})	
		$("input[type=checkbox]").unbind("click").click(function(){
			if($(this).is(':checked')){
				file_path = $(this).val()
				console.log(file_path)
				me.doc_list.push(file_path.substring(7, file_path.length))
			}
			else{
				file_path = $(this).val()
				var index = me.doc_list.indexOf(file_path.substring(7, file_path.length));
				if (index >= 0) {
  					me.doc_list.splice( index, 1 );
				}
			}
		});
		this.image_gallery()
	},
	image_gallery: function(){

	}
})