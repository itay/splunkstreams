var BaseStream = require('stream');
var inherits = require('util').inherits;

var TransformStream = function(transform, options) {
    this.readable = true;
    this.writable = true;
    this.destroyed = false;
    this.paused = false;
    this.state = {};
    this.options = options || {};
    this.transform = transform || function() {};
};

inherits(TransformStream, BaseStream);

TransformStream.prototype.write = function(data) {
    if (this.destroyed) {
        return false;
    }
    
    var that = this;
    var backpressure = this.transform.call(this, data, function() {        
        var args = Array.prototype.slice.call(arguments);
        that.emit.apply(that, ['data'].concat(args))
    });
    
    return !this.paused && backpressure;
};

TransformStream.prototype.resume = function() {
    this.paused = false;
    this.emit("drain");
};

TransformStream.prototype.pause = function() {
    this.paused = true;
};

TransformStream.prototype.end = function() {
    this.destroyed = true;
    this.emit("close");
    
    var args = Array.prototype.slice.call(arguments);
    this.emit.apply(this, ['end'].concat(args))
};

TransformStream.prototype.destroy = TransformStream.prototype.destroySoon = TransformStream.prototype.end;

module.exports = TransformStream;