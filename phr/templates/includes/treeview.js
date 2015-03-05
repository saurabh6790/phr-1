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
	},
	make_tree_base: function(){
		// console.log('make_tree_base')
		var me = this;
		$('<div class="event_tree" style="width=100%;">\
				<div class="tree" style="width:40%;float:left;min-height:500px;">\
					<ul>\
					</ul>\
				</div>\
				<div class="thumb" style="width:60%;float:left;">\
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
				<span id="%(id)s"><i class="%(icon)s"></i> %(label)s <span class="badge">4</span> </span> <a href=""></a>\
				<ul></ul>\
			</li>', dic)).appendTo($('.tree').find('ul').first())
	
			$.each(me.mapper[dic['id']], function(j, chld_dic){
				$(repl_str('<li>\
					<span id="%(id)s"><i class="icon-leaf"></i> %(label)s <span class="badge">4</span> </span> <a href=""></a>\
				</li>', chld_dic)).appendTo($li.find('ul'))
			})
		})
	},
	add_tree_events:function(){
		var me = this;
			// console.log(['add_tree_events', me.args['dms_file_list']])
		$(function () {
			me.args['dms_file_list'] = me.args['dms_file_list'] ? me.args['dms_file_list'] : [];

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
					// console.log(['sub folder ', me.args['dms_file_list']])
					ThumbNails.prototype.init(me.wrapper, {'folder':me.folder, 
						'sub_folder':$(this).find('span').attr('id'), 'profile_id': me.args['profile_id'], 'display': me.disp, 
						'dms_file_list': me.args['dms_file_list'], 'doc_list': me.doc_list})
				})

			});
		});
	}
})