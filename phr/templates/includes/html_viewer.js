frappe.provide("templates/includes");

window.HTMLViewer = function(){
	this.wrapper = ""
}

$.extend(window.HTMLViewer.prototype,{
	init:function(wrapper, args, entityid){
		this.wrapper = wrapper;
		this.args = args;
		RenderFormFields.prototype.init(this.wrapper, {'file_name': this.args['file_name'], 'param':'html_viewer', "method": "profile"} , entityid)
	},
	form_generator_callback: function(profile_info){
		scroll_top()
    if(profile_info['date_of_birth']){
      var dt = new Date(profile_info['date_of_birth'])
      profile_info['date_of_birth'] = (dt.getDate() < 10 ? "0" + (dt.getDate()) : dt.getDate())  + '/' + (dt.getMonth() < 10 ? "0" + (dt.getMonth()+1) : dt.getMonth()+1) + '/' + dt.getFullYear()
    }
		$(repl_str('<div class="panel-body no-padding"> \
                    <div class="col-md-12">\
                        <div class="text-center profile_photo">\
                        </div>\
                        <div class="text-center profile_name">\
                          %(person_firstname)s  %(person_middlename)s %(person_lastname)s\
                        </div>\
                        <div class="profile_dtls">\
                          <div class="col-md-6 profile_dtls_left">\
                            <ul>\
                              <li>\
                                <span class="profile_field">Gender:</span>\
                                <span class="profile_value">%(gender)s</span>\
                              </li>\
                              <li>\
                                <span class="profile_field">Date of Birth:</span>\
                                <span class="profile_value">%(date_of_birth)s</span>\
                              </li>\
                              <li>\
                                <span class="profile_field">Marital status:</span>\
                                <span class="profile_value">%(marital_status)s</span>\
                              </li>\
                              <li class="rel">\
                                <span class="profile_field">Relation:</span>\
                                <span class="profile_value">%(relationship)s</span>\
                              </li>\
                              <li>\
                                <span class="profile_field">Mobile No:</span>\
                                <span class="profile_value" style="display: inline-flex;">%(mobile)s </span>\
                                <span style="color:#17329E;" id="vm">Mobile Not Verified- <a id="verify_mobile" style="color:#17329E;">Verify</a></span>\
                              </li>\
                              <li>\
                                <span class="profile_field">Email:</span>\
                                <span class="profile_value">%(email)s</span>\
                              </li>\
                              <li class="margin-bottom-15">\
                                <span class="profile_field">Address:</span>\
                                <span class="profile_value" style="display: inline-flex;">%(address1)s <br/> %(address2)s <br/> %(city)s %(state)s %(country)s %(pincode)s </span>\
                              </li>\
                              <li>\
                                <span class="profile_field">Blood group:</span>\
                                <span class="profile_value">%(blod_group)s</span>\
                              </li>\
                              <li>\
                                <span class="profile_field">Height:</span>\
                                <span class="profile_value">%(height)s Cms</span>\
                              </li>\
                              <li>\
                                <span class="profile_field">Weight:</span>\
                                <span class="profile_value">%(weight)s Kg</span>\
                              </li>\
                            </ul>\
                            </div>\
                          <div class="col-md-6 profile_dtls_right">\
                            <ul>\
                              <li>\
                                <p class="profile_pts green medium">ADDICTIONS</p>\
                                <p>%(addiction)s</p>\
                              </li>\
                              <li>\
                                <p class="profile_pts green medium">ALLERGIES</p>\
                                <p>%(allergies)s</p>\
                              </li>\
                              <li>\
                                <p class="profile_pts green medium">DIET TYPE</p>\
                                <p>%(diet_type)s</p>\
                              </li>\
                              <li>\
                                <p class="profile_pts green medium">INSURANCE</p>\
                                <p>%(insurance_provider)s</p>\
                              </li>\
                            </ul>\
                          </div>\
                          <div class="clearfix"></div>\
                        </div>\
                        <div class="clearfix"></div>\
                    </div> \
                </div>\
            <!--Events End--> \
		</div>',profile_info)).appendTo($('.profile_viewer'))
    if (sessionStorage.getItem('pid')==sessionStorage.getItem('cid') || frappe.get_cookie('user_type')=='provider') $('.rel').remove()
    MobileVerifier.prototype.check_contact_verified(profile_info['mobile'])
	}
})