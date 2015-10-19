function inherit(base, methods) {
    var sub = function() {
        base.apply(this, arguments); // Call base class constructor

        // Call sub class initialize method that will act like a constructor
        this.init.apply(this, arguments);
    };
    sub.prototype = Object.create(base.prototype);
    $.extend(sub.prototype, methods);
    return sub;
}