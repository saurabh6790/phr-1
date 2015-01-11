function repl_str(str, args){
	$.each(args, function(key, val){
		var reg = new RegExp("\\%\\(" + key + "\\)s", "igm");
		str = str.replace(reg, args[key]);
	})
	return str
}


$.arrayIntersect = function(a, b){
	return $.grep(a, function(i){
		console.log(i)
		return $.inArray(i, b) > -1;
	});
};