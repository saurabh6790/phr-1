function send_linkedphr_updates(email_msg,text_msg,entity){
	if (sessionStorage.getItem("cid")!=sessionStorage.getItem("pid")){
		//email_msg='Linked PHR Has Updated His Profile'
		//text_msg='Linked PHR Has Updated His Profile'
		frappe.call({
			method:'phr.templates.pages.profile.notify_about_linked_phrs',
			args:{"profile_id":sessionStorage.getItem("pid"),"email_msg":email_msg,"text_msg":text_msg,"entity":entity},
			callback: function(r) {
				
			}
		});
    }
}