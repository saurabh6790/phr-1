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
		me.disp = args['display']
		me.doc_list = args['doc_list'];
		

		me.parent_mapper = [{'label' : 'Consultation', 'id':'consultancy-11', 'icon':'icon-user-md',"count":me.args['event_dict']['11']}, 
				{'label' : 'Event Snap', 'id':'event_snap-12','icon':'icon-camera',"count":me.args['event_dict']['12']}, 
				{'label' : 'Lab Reports', 'id':'lab_reports-13', 'icon':'icon-beaker',"count":me.args['event_dict']['13']}, 
				{'label' : 'Prescription', 'id':'prescription-14', 'icon':'icon-file',"count":me.args['event_dict']['14']},
				{'label' : 'Cost of Care', 'id':'cost_of_care-15', 'icon':'icon-credit-card',"count":me.args['event_dict']['15']}]

		me.mapper = {'consultancy-11':[{'label' : 'DOCTORS  CLINICAL NOTES', 'id':'A_51',"count":me.args['sub_event_count']['1151']}, 
									{'label' : 'TEST / INVESTIGATION ADVISED', 'id': 'B_52',"count":me.args['sub_event_count']['1152']}, 
									{'label' : 'REFERAL NOTE', 'id': 'C_53',"count":me.args['sub_event_count']['1153']}],
					'event_snap-12':[{'label' : 'PATIENT SNAPS', 'id' : 'A_51',"count":me.args['sub_event_count']['1251']},
							{'label':'CLINICAL SNAPS', 'id': 'B_52',"count":me.args['sub_event_count']['1252']}],
					'lab_reports-13':[{'label': 'TEST REPORTS', 'id':'A_51',"count":me.args['sub_event_count']['1351']}, 
							{'label':'TEST IMAGES', 'id':'B_52',"count":me.args['sub_event_count']['1352']}],
					'prescription-14':[{'label':'PRESCRIBED MEDICATION', 'id':'A_51',"count":me.args['sub_event_count']['1451']},
							{'label':'PRISCRIBED ADVICE','id':'B_52',"count":me.args['sub_event_count']['1452']},
							{'label':'DISCHARGE SUMMERY', 'id': 'C_53',"count":me.args['sub_event_count']['1453']}],
					'cost_of_care-15':[{'label': 'MEDICAL BILLS', 'id': 'A_51',"count":me.args['sub_event_count']['1551']}]
				}

		this.make_tree_base()
		this.add_tree_events()
	},
	make_tree_base: function(){
		var me = this;
		$('.event_section').empty();

		$('<div class="event_tree" style="width=100%;">\
				<div class="tree" style="width:30%;float:left;min-height:500px;">\
					<ul>\
					</ul>\
				</div>\
				<div class="thumb" style="width:70%;float:left;">\
					<div align="center"><h4> Document Uploader and Viewer </h4></div>\
					<div style="word-wrap: break-word;width:100%;">\
						<p>You can upload images and pdfs of your here.</p>\
						<p>Click any opion on left and select a right head to upload.</p>\
						<p><b>Image/PDF size: 20 MB max</b></p>\
						<p>Further you have options to:</p>\
						<p style="text-indent: 1em;">1. <b> Upload Image/PDF </b>: Do you have report handy, upload it from here. </p>\
						<p style="text-indent: 1em;">2. <b> Write Description </b>: Don\'t have an Image/PDF. Write description, this will be saved as a pdf.</p>\
						<p style="text-indent: 1em;">3. <b> Capture Image </b>: Capture direct image from webcam -- <b>Comming Soon !!!!!!</b></p>\
				</div>\
			</div>\
			<br style="clear:both" />').appendTo($('.event_section'))
		
		$.each(me.parent_mapper, function(i, dic){
			$li = $(repl_str('<li>\
				<span id="%(id)s"><i class="%(icon)s"></i> %(label)s <span class="badge" style="background-color:#1094A0;">%(count)s</span> </span> <a href=""></a>\
				<ul></ul>\
			</li>', dic)).appendTo($('.tree').find('ul').first())
	
			$.each(me.mapper[dic['id']], function(j, chld_dic){
				$(repl_str('<li>\
					<span id="%(id)s"><i class="icon-leaf"></i> %(label)s <span class="badge" style="background-color:#1094A0;">%(count)s</span> </span> <a href=""></a>\
				</li>', chld_dic)).appendTo($li.find('ul'))
			})
		})

		if(me.args['req_id']){
			$('.tree .badge').remove()
		}
	
	},
	add_tree_events:function(){
		var me = this;
		$(function () {
			me.args['dms_file_list'] = me.args['dms_file_list'] ? me.args['dms_file_list'] : [];

			$('.tree li:has(ul)').addClass('parent_li').find(' > span').attr('title', 'Expand this branch');
			
			$('.tree li.parent_li').find(' > ul > li').hide('fast');
			
			$('.tree li.parent_li > span').unbind('click').on('click', function (e) {

				$('.tree li.parent_li').find(' > ul > li').hide('fast');
				$('.tree li.parent_li > span').removeClass('selected')
				$('.tree li.parent_li').find(' > ul > li').removeClass('selected-chld')

				$(this).addClass('selected')
				var children = $(this).parent('li.parent_li').find(' > ul > li');

				me.folder = $(this).attr('id');

				if (children.is(":visible")) {
					children.hide('fast');
					$('.tree li.parent_li > span').removeClass('selected')
					$(this).attr('title', 'Expand this branch').find(' > i').addClass('icon-plus-sign').removeClass('icon-minus-sign');
				} else {
					children.show('fast');
					$(this).attr('title', 'Collapse this branch').find(' > i').addClass('icon-minus-sign').removeClass('icon-plus-sign');
				}
				e.stopPropagation();

				children.addClass('parent_li')

				children.unbind('click').on('click', function(){
					children.removeClass('selected-chld')
					$(this).addClass('selected-chld')

					ThumbNails.prototype.init(me.wrapper, {'folder':me.folder, 
						'sub_folder':$(this).find('span').attr('id'), 'profile_id': me.args['profile_id'], 'display': me.disp, 
						'dms_file_list': me.args['dms_file_list'], 'doc_list': me.doc_list, 'req_id': me.args['req_id']})
				})

			});
		});
	}
})