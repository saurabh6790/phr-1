frappe.provide("templates/includes");
frappe.provide("frappe");

{% include "templates/includes/share_phr.js" %}

window.Visit = inherit(ListView,{
	init: function(wrapper, json_file, profile_id, entity_id){
		var me = this;
		this.wrapper = wrapper;
		$('#main-con').empty();
		this.selected_files = [];
		this.dms_file_list = [];
		this.doc_list = [];
		this.profile_id = profile_id;
		this.from_date=$('[name="from_date"]').val();
		this.to_date=$('[name="to_date"]').val();

		ListView.prototype.init(this.wrapper, {"file_name": "visit", 
			'cmd':"event.get_visit_data",
			'tab_at': 4,
			'visit_date_from':this.from_date,
			'visit_date_to':this.to_date,
			'profile_id':profile_id})

		$('.new_controller').hide()
		$('.save_controller').remove();

		this.add_share_event()
		this.add_search_event()
		scroll_top()
		
	},
	add_share_event:function(){
		var me=this;
		$("#share").click(function(){
			var fg = false;
			$('.table').find('thead').each(function(){
				var row = $(this);
				$('th', row).map(function(index, th) {
					if ($(th).find('input[type="checkbox"]').is(':checked')) {
						me.selected_files.push($(th).find('input[type="checkbox"]').attr('id'))
					}
				})
			})
			$('.table').find('tr').each(function () {
				var row = $(this);
				$('td', row).map(function(index, td) {
					if ($(td).find('input[name="visit"]').is(':checked')) {
						me.selected_files.push($(td).find('input[name="visit"]').attr('id'))
						fg = true;
					}
				});
			})
			
			if (fg){
				$('<li><a nohref>Share Pannel</a></li>').click(function(){
					$(this).nextAll().remove()
					// $(this).remove()
					$('.uploader').remove();
					SharePhr.prototype.init(me.wrapper,  {"file_name" : "share_phr_visit", 
						"method": "visit", 
						'event_id': $(me.selected_files).last()[0], 
						'selected_files':me.selected_files, 
						'doc_list': me.doc_list, 
						"profile_id":me.profile_id
					})
					// Events.prototype.write_visit_file($(me.selected_files).last()[0], me.profile_id)
					
				}).appendTo('.breadcrumb');	

				SharePhr.prototype.init(me.wrapper, {"file_name" : "share_phr_visit", 
					"method": "visit", 
					'event_id': $(me.selected_files).last()[0], 
					'selected_files':me.selected_files, 
					'doc_list': me.doc_list, 
					"profile_id":me.profile_id
				})
				// Events.prototype.write_visit_file($(me.selected_files).last()[0], me.profile_id)
			}
			else{
				frappe.msgprint("Please first select a Visit. ")
			}
			
		})
	},
	add_search_event:function(wrapper,json_file,profile_id,entity_id){
		var me = this;
		$('.search_visit').click(function(){
			from_date=$('[name="from_date"]').val()
			to_date=$('[name="to_date"]').val()
			console.log([from_date, to_date])
			ListView.prototype.init(this.wrapper, {"file_name" : "visit",
			'search':"visit",
			'tab_at': 4,
			'visit_date_from':from_date,
			'visit_date_to':to_date,
			'profile_id':me.profile_id})
		})
	}
})