frappe.provide("frappe")
frappe.provide("templates/includes")
{% include "templates/includes/inherit.js" %}
{% include "templates/includes/utils.js" %}
{% include "templates/includes/form_generator.js" %}


var PHRComments = function(){
	wrapper = ""
}

$.extend(PHRComments.prototype, {
	init:function(args){
		console.log(['comment', args["wrapper"]])
		this.wrapper = args["wrapper"];
		this.args = args;
		this.make_comment_section();
		this.get_comments()
	},
	make_comment_section:function(){
		$('<div class="form-comments">\
				<div class="comments db">\
				</div>\
			</div>\
			<div class="media comment" data-name="%(name)s">\
				<span class="pull-left avatar avatar-small">    \
					<img class="media-object" src="https://secure.gravatar.com/avatar/7b7bc2512ee1fedcd76bdc68926d4f7b?d=retro">   </span>\
					<div class="media-body">\
						<textarea style="height: 80px" class="form-control" ></textarea>\
						<div class="text-right" style="margin-top: 10px">\
							<button class="btn btn-default btn-go btn-sm" id="add_comment"> \
								<i class="icon-ok"></i> Add comment \
							</button>\
						</div>\
					</div>\
			</div>').appendTo($(this.wrapper))
		this.add_comment()	
	},
	add_comment: function(){
		var me = this;
		$('#add_comment').click(function(){
			frappe.call({
				method:"phr.templates.pages.phr_comments.set_comment",
				args:{"comment": $(me.wrapper).find('textarea').val(), 
						"provider_id": me.args["provider_id"],
						"profile_id": me.args["profile_id"],
						"event_id": me.args["event_id"],
						"event_title" :me.args["event_title"]
				},
				callback:function(r){
					me.get_comments()
				}
			})
		})
	},
	get_comments:function(){
		var me = this;
		console.log("get_comments")
		frappe.call({
			method:"phr.templates.pages.phr_comments.get_comments",
			args:{"profile_id": me.args["profile_id"], 
				"provider_id": me.args["provider_id"],
				"event_id": me.args["event_id"]	},
			callback:function(r){
				me.render_comments(r.message)
			}
		})
	},
	render_comments: function(comments){
		var me = this;
		$(this.wrapper).find('.db').empty();

		$.each(comments, function(i, comment){
			$(repl_str('<div class="media comment" data-name="%(name)s">\
				<span class="pull-left avatar avatar-small">\
					<img class="media-object" src="%(usr_img)s">\
				</span>\
				<span class="pull-left comment-icon">\
					<i class="icon-plus icon-timeline" style="background-color: #1abc9c; color: #fff; "></i>\
				</span>\
				<div class="media-body comment-body">\
					<p>%(comment_body)s</p>\
					<div>\
						<span class="small text-muted">\
							%(comment_maker)s / <span class="frappe-timestamp" >%(timespan)s</span>\
				 		</span>\
				 	</div>\
				</div>\
			</div>',comment)).appendTo($(me.wrapper).find('.db'))
		})
		
	}

})
