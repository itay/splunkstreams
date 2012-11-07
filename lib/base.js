var BaseStream = require('stream');
var inherits = require('util').inherits;
var Async = require('splunk-sdk').Async;

var BaseSplunkStream = function(service, searchOptions) {
    this.readable = true;
    this.paused = false;
    this.destroyed  = false;
    this.connections = 0;
    this.service = service;
    this.searchOptions = searchOptions;
    
    this._interval = 1000;
};

inherits(BaseSplunkStream, BaseStream);

BaseSplunkStream.prototype._startSearch = function() {
    var that = this;
    that.service.login(function(err, success) {
        if (err || !success) {
            that.emit("error", err || new Error("Login failed"));
            return;
        }
        
        that.service.search(that.searchOptions.search, that.searchOptions, function(err, search) {
            if (err) {
                that._stopSearch();
                that.emit("error", err);
                return;
            }
            
            that.search = search;
            that.loop();
        });
    });
};

BaseSplunkStream.prototype._stopSearch = function() {
    if (this.search) {
        this.search.cancel();
        this.search = null;
    }
    
    // Whenever we stop the search,
    // we reset to 0
    this.connections = 0;
};

BaseSplunkStream.prototype.interval = function(interval) {
    if (interval === undefined || interval === null) {
        return this._interval;
    }  
    
    this._interval = Math.max(interval, 0);
    return this;
};

BaseSplunkStream.prototype.connect = function() {
    if (this.destroyed) {
        return;
    }
    
    var currentConnections = this.connections++;
    
    // If we had no connections before, then connect now
    if (currentConnections === 0) {
        this._startSearch();
    }
};

BaseSplunkStream.prototype.disconnect = function() {
    if (this.destroyed) {
        return;
    }
    
    var currentConnections = --this.connections;
    
    // If we have no connections now, then disconnect
    if (currentConnections === 0) {
        this._stopSearch();
    }
};

BaseSplunkStream.prototype.pause = function() {
    this.paused = true;  
};

BaseSplunkStream.prototype.resume = function() {
    this.paused = false;  
};

BaseSplunkStream.prototype.end = BaseSplunkStream.prototype.destroy = function() {
    this._stopSearch();
    this.destroyed = true;
    
    var args = Array.prototype.slice.call(arguments);
    this.emit.apply(this, ['end'].concat(args))
};

module.exports = BaseSplunkStream;