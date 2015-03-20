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

var millisecondsPerDay = 24 * 60 * 60 * 1000;
function diffDays(startDate, endDate) {
    return Math.floor(getfdate(endDate) / millisecondsPerDay) - Math.floor(getfdate(startDate) / millisecondsPerDay);
}


function repl_str(str, args){
	$.each(args, function(key, val){
		var reg = new RegExp("\\%\\(" + key + "\\)s", "igm");
		str = str.replace(reg, args[key]);
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

$.fn.pageMe = function(opts){
    var $this = this,
        defaults = {
            perPage: 7,
            showPrevNext: false,
            hidePageNumbers: false
        },
        settings = $.extend(defaults, opts);
    
    var listElement = $this;
    var perPage = settings.perPage; 
    var children = listElement.children();
    var pager = $('.pager');
    
    if (typeof settings.childSelector!="undefined") {
        children = listElement.find(settings.childSelector);
    }
    
    if (typeof settings.pagerSelector!="undefined") {
        pager = $(settings.pagerSelector);
    }
    
    var numItems = children.size();
    var numPages = Math.ceil(numItems/perPage);

    pager.data("curr",0);
    
    if (settings.showPrevNext){
        $('<li><a href="#" class="prev_link">«</a></li>').appendTo(pager);
    }
    
    var curr = 0;
    while(numPages > curr && (settings.hidePageNumbers==false)){
        $('<li><a href="#" class="page_link">'+(curr+1)+'</a></li>').appendTo(pager);
        curr++;
    }
    
    if (settings.showPrevNext){
        $('<li><a href="#" class="next_link">»</a></li>').appendTo(pager);
    }
    
    pager.find('.page_link:first').addClass('active');
    pager.find('.prev_link').hide();
    if (numPages<=1) {
        pager.find('.next_link').hide();
    }
  	pager.children().eq(1).addClass("active");
    
    children.hide();
    children.slice(0, perPage).show();
    
    pager.find('li .page_link').click(function(){
        var clickedPage = $(this).html().valueOf()-1;
        goTo(clickedPage,perPage);
        return false;
    });
    pager.find('li .prev_link').click(function(){
        previous();
        return false;
    });
    pager.find('li .next_link').click(function(){
        next();
        return false;
    });
    
    function previous(){
        var goToPage = parseInt(pager.data("curr")) - 1;
        goTo(goToPage);
    }
     
    function next(){
        goToPage = parseInt(pager.data("curr")) + 1;
        goTo(goToPage);
    }
    
    function goTo(page){
        var startAt = page * perPage,
            endOn = startAt + perPage;
        
        children.css('display','none').slice(startAt, endOn).show();
        
        if (page>=1) {
            pager.find('.prev_link').show();
        }
        else {
            pager.find('.prev_link').hide();
        }
        
        if (page<(numPages-1)) {
            pager.find('.next_link').show();
        }
        else {
            pager.find('.next_link').hide();
        }
        
        pager.data("curr",page);
      	pager.children().removeClass("active");
        pager.children().eq(page+1).addClass("active");
    
    }
};