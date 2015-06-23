moment.defaultFormat = "DD-MM-YYYY";


function parseDate(s) {
  var b = s.split(/\D/);
  return new Date(b[2],--b[1],b[0]);
}

function daydiff(d1,d2) {
    return (d2-d1)/(1000*60*60*24);
}

function getfdate(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}

function getfdatetime(date){
    console.log(["ss",type(date)])
    var result = new Date(date);
    

}

var millisecondsPerDay = 24 * 60 * 60 * 1000;
function diffDays(startDate, endDate) {
    return Math.floor(getfdate(endDate) / millisecondsPerDay) - Math.floor(getfdate(startDate) / millisecondsPerDay);
}

function validate_currentdatetime(val){
    getfdatetime(val)
    /*
    if (diffDays(parseDate(val),new Date()) > 0){
        return false
    }*/
    return true
}


function getFileExtension(filename){
  console.log(["sa",filename])  
  var ext = /^.+\.([^.]+)$/.exec(filename);
  ext == null ? "" : ext[1];
  console.log(["sa",filename,ext[1]])
  if (!/(.*?)(jpg|pdf|png|PDF|JPG|PNG|JPEG)$/.test(ext)) {
    return false
  }
  else{
    return true
  }
}


function repl_str(str, args){
	$.each(args, function(key, val){
		var reg = new RegExp("\\%\\(" + key + "\\)s", "igm");
        // console.log([key, args[key]])
        if (args[key])	str = str.replace(reg, args[key]);
        if (args[key] === 0) str = str.replace(reg, args[key]);
        else str = str.replace(reg, '');
	})
	return str
}

function validate_mobile(mobile){
    var pattern = /^\d{10}$/;
    if (!pattern.test(mobile)) {
        return false;
    }
    else{
        return true
    }
}

function scroll_top(){
    $("html, body").animate({
        scrollTop: 0
    }, "slow");
}

function validate_email(id) {
    return (id.toLowerCase().search("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")==-1) ? 0 : 1;

}

function s_alert(txt, seconds) {
    if(!$('#dialog-container').length) {
        $('<div id="dialog-container">').appendTo('body');
    }
    if(!$('#alert-container').length) {
        $('<div id="alert-container"></div>').appendTo('#dialog-container');
    }

    var div = $('<div class="alert alert-warning" style="box-shadow: 0px 0px 2px rgba(0,0,0,0.5)">\
        <a class="close" style="margin-left: 10px;">&times;</a>'+ txt +'</div>')
            .appendTo('#alert-container')
    div.find('.close').click(function() {
        $(this).parent().remove();
        return false;
    });
    div.delay(seconds ? seconds * 1000 : 3000).fadeOut(300);
    return div;
}


$.arrayIntersect = function(a, b){
	return $.grep(a, function(i){
		return $.inArray(i, b) > -1;
	});
};

function disable_fields(fields){
    if(typeof(fields) == 'string'){
        $('[name="'+fields+'"]').attr('disabled', 'disabled')
    }
    else{
        $.each(fields, function(i, field){
            $('[name="'+field+'"]').attr('disabled', 'disabled')
        })
    }
}

var disable_field = disable_fields
