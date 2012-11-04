var BaseStream = require('stream');
var inherits = require('util').inherits;

var SplunkStream = function(options) {
    this.readable = true;
    this.paused = false;
    
    this._start();
};

inherits(SplunkStream, BaseStream);

SplunkStream.prototype._start = function() {
    var that = this;
    var counter = 0;
    var a = setInterval(function() {
        if (!that.paused) {
            that.emit("data", (counter++) + "\n");
        }
    }, 1000)
};


SplunkStream.prototype.pause = function() {
    this.paused = true;  
};

SplunkStream.prototype.resume = function() {
    this.paused = false;  
};