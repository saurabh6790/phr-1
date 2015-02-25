frappe.provide("templates/includes");
frappe.provide("frappe");
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}
{% include "templates/includes/uploader.js" %}

var TreeView = function(){
	this.wrapper = ""
}

$.extend(TreeView.prototype, {
	init:function(args){
		var me =this;
		me.args = args;

		me.dms_file_list = args['dms_file_list']
		
		me.parent_mapper = [{'label' : 'Consultation', 'id':'consultancy-11', 'icon':'icon-user-md'}, 
				{'label' : 'Event Snap', 'id':'event_snap-12','icon':'icon-camera'}, 
				{'label' : 'Lab Reports', 'id':'lab_reports-13', 'icon':'icon-beaker'}, 
				{'label' : 'Prescription', 'id':'prescription-14', 'icon':'icon-file'},
				{'label' : 'Cost of Care', 'id':'cost_of_care-15', 'icon':'icon-credit-card'}]

		me.mapper = {'consultancy-11':[{'label' : 'DOCTORS  CLINICAL NOTES', 'id':'A_51'}, 
									{'label' : 'TEST / INVESTIGATION ADVISED', 'id': 'B_52'}, 
									{'label' : 'REFERAL NOTE', 'id': 'C_53'}],
					'event_snap-12':[{'label' : 'PATIENT SNAPS', 'id' : 'A_51'},
							{'label':'CLINICAL SNAPS', 'id': 'B_52'}],
					'lab_reports-13':[{'label': 'TEST REPORTS', 'id':'A_51'}, 
							{'label':'TEST IMAGES', 'id':'B_52'}],
					'prescription-14':[{'label':'PRESCRIBED MEDICATION', 'id':'A_51'},
							{'label':'PRISCRIBED ADVICE','id':'B_52'},
							{'label':'DISCHARGE SUMMERY', 'id': 'C_53'}],
					'cost_of_care-15':[{'label': 'MEDICAL BILLS', 'id': 'A_51'}]
				}

		this.make_tree_base()
		this.add_tree_events()
	// $('<button style="float:left;width:40%;" id="img" class="btn btn-primary" > Upload Image </button>\
	// 	<button style="float:left;width:40%;margin-left:15%;" id="descr" class="btn btn-primary" > Write Description </button>\
	// 	<div style="display:%(uploader_display)s">\
	// 		<div id="attach"> Attach </div>\
	// 		<div class="form-group row" style="display: block;padding-top: 8%;margin-right:2%;" id="desc">\
	// 			<div class="col-xs-12">\
	// 				<div class="control-input">\
	// 					<textarea type="text" class="form-control" \
	// 						placeholder="Don\'t have an image, write a description. This will be saved below as pdf." name="attch_desc"\
	// 						aria-describedby="basic-addon2"></textarea>\
	// 				</div>\
	// 			</div>\
	// 		</div>\
	// 	</div>\
	// 	<hr>\
	// 	<div style="width:30%;float:left;"><div>\
	// 		<input type="checkbox" name="image" value="/files/1424436087454-455652.jpg" >\
	// 	</div>\
	// 		<a nohref class="control-image" data-name="/files/1424436087454-455652.jpg">\
	// 			<img style="height:150px;" src="/files/1424436087454-455652.jpg">\
	// 			<br><label style="width: 150px;word-wrap: break-word;">1424436087454-455652.jpg</label>\
	// 		</a>\
	// 	</div>\
	// 	<div style="width:30%;float:left;"><div>\
	// 		<input type="checkbox" name="image" value="/files/1421061756747-465360.jpg" >\
	// 	</div>\
	// 		<a nohref class="control-image" data-name="/files/1421061756747-465360.jpg">\
	// 			<img style="height:150px;" src="/files/1421061756747-465360.jpg">\
	// 			<br><label style="width: 150px;word-wrap: break-word;">1421061756747-465360.jpg</label>\
	// 		</a>\
	// 	</div>\
	// 	<div style="width:30%;float:left;"><div>\
	// 		<input type="checkbox" name="image" value="/files/images.jpg" >\
	// 	</div>\
	// 		<a nohref class="control-image" data-name="/files/images.jpg">\
	// 			<img style="height:150px;" src="/files/images.jpg">\
	// 			<br><label style="width: 150px;word-wrap: break-word;">images.jpg</label>\
	// 		</a>\
	// 	</div>').appendTo($('.thumb'))

	// 	upload.make({
	// 		parent: $('#attach'),
	// 		args:{'profile_id': '1', 'folder':'51', 
	// 			'sub_folder': '11', 'event_id': $('input[name="entityid"]').val()},
	// 		callback:function(attachment, r) {
	// 			NProgress.done();
	// 			me.args['dms_file_list'] = me.args['dms_file_list'] ? me.args['dms_file_list'] : [];
	// 			me.args['dms_file_list'].push(
	// 				{
	// 					"tag_id": me.folder.split('-')[1]+''+me.sub_folder.split('_')[1],
	// 					"tag_name": me.folder.split('-')[0],
	//             		"sub_tag_name": me.sub_folder.split('_')[0],
	//             		"file_id": [
	// 						attachment['file_name']
	// 					],
	//             		"file_location": [
	//             			attachment['site_path'] +'/'+ me.args['profile_id'] + '/' +  $('input[name="entityid"]').val() + '/' + me.folder + '/' +  me.sub_folder + '/' + attachment['file_name']
	// 					],
	// 					"text_file_desc": $('[name="attch_desc"]').val() ? $('[name="attch_desc"]').val() : "" ,
	// 					"text_file_id": $('[name="attch_desc"]').val() ? me.folder+'_'+me.sub_folder+'.pdf' : "",
	// 					"text_file_loc": $('[name="attch_desc"]').val() ? attachment['site_path'] +'/'+ me.args['profile_id'] + '/' +  $('input[name="entityid"]').val() + '/' + me.folder + '/' +  me.sub_folder + '/' + me.folder+'_'+me.sub_folder+'.pdf' : ""
	// 			})
	// 			me.render_uploader_and_files();
	// 		}
	// 	});
		// $('#desc').hide('fast');
		// $("#descr").on("click",function(){
			
		// 		$('#attach').hide('fast');
		// 		$('#desc').show('fast');
			
		// })
		// $('#img').on("click", function(){

		// 		$('#desc').hide('fast');
		// 		$('#attach').show('fast');
			
		// })

	},
	make_tree_base: function(){
		var me = this;
		$('<div style="width=100%;">\
				<div class="tree" style="width:40%;float:left;min-height:500px;">\
					<ul>\
					</ul>\
				</div>\
				<div class="thumb" style="width:60%;float:left;"></div>\
			</div>').appendTo($('.event_section'))

		$.each(me.parent_mapper, function(i, dic){
			$li = $(repl_str('<li>\
				<span id="%(id)s"><i class="%(icon)s"></i> %(label)s </span> <a href=""></a>\
				<ul></ul>\
			</li>', dic)).appendTo($('.tree').find('ul').first())
	
			$.each(me.mapper[dic['id']], function(j, chld_dic){
				$(repl_str('<li>\
					<span id="%(id)s"><i class="icon-leaf"></i> %(label)s </span> <a href=""></a>\
				</li>', chld_dic)).appendTo($li.find('ul'))
			})
		})
	},
	add_tree_events:function(){
		var me = this;
		$(function () {
			$('.tree li:has(ul)').addClass('parent_li').find(' > span').attr('title', 'Expand this branch');
			
			$('.tree li.parent_li').find(' > ul > li').hide('fast');
			
			$('.tree li.parent_li > span').on('click', function (e) {
				
				var children = $(this).parent('li.parent_li').find(' > ul > li');

				me.folder = $(this).attr('id');

				if (children.is(":visible")) {
					children.hide('fast');
					$(this).attr('title', 'Expand this branch').find(' > i').addClass('icon-plus-sign').removeClass('icon-minus-sign');
				} else {
					children.show('fast');
					$(this).attr('title', 'Collapse this branch').find(' > i').addClass('icon-minus-sign').removeClass('icon-plus-sign');
				}
				e.stopPropagation();

				children.addClass('parent_li')

				children.on('click', function(){
					me.dms_file_list = me.dms_file_list ? me.dms_file_list : [];

					ThumbNails.prototype.init(me.wrapper, {'folder':me.folder, 
						'sub_folder':$(this).find('span').attr('id'), 'profile_id': me.args['profile_id'], 'display':'none', 
						'dms_file_list': me.dms_file_list})
				})

			});
		});
	}
})