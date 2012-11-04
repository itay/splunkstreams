var BaseSplunkStream = require('./base')
var inherits = require('util').inherits;
var Async = require('splunk-sdk').Async;

var NormalSplunkStream = function() {
    return BaseSplunkStream.apply(this, arguments);
};

inherits(NormalSplunkStream, BaseSplunkStream);

NormalSplunkStream.prototype.loop = function() {
    var that = this;
    var isDone = false;
    Async.whilst(
        function() { return !isDone && !that.destroyed && that.search; },
        function(done) {
            var job = that.search;
            
            // If we're paused, skip this loop iteration
            if (that.paused) {
                Async.sleep(that.interval, done);
                return;
            }
            else if (!job) {
                done();
                return;
            }
            
            job.fetch(
                function(err) {
                    if (err) {
                        done(err);
                        return;
                    }
                    
                    if (that.destroyed || !that.search) {
                        done();
                        return;
                    }
                    
                    if (that.paused) {
                        Async.sleep(that.interval, done);
                        return;
                    }
                    
                    var properties = that.search.properties();
                    isDone = properties.isDone;
                    
                    if (isDone) {
                        done();
                    }
                    else {
                        Async.sleep(that.interval, done);
                    }
                }
            );
        },
        function(err) {
            if (err) {
                that._stopSearch();
                that.emit("error", err);
            }
            else {
                that._fetchResults();
            }
        }
    );
};

NormalSplunkStream.prototype._fetchResults = function() {
    var offset = 0;
    var resultsPerPage = 1000;
    var isDone = false;
    
    var that = this;
    Async.whilst(
        function() { return !isDone && !that.destroyed && that.search; },
        function(done) {
            that.search.results(
                {
                    output_mode: "json", output_time_format: "%s", 
                    offset: offset, count: resultsPerPage
                }, 
                function(err, results) {
                    if (err) {
                        done(err);
                        return;
                    }
                    
                    if (that.destroyed || !that.search) {
                        done();
                        return;
                    }
                    
                    if (that.paused) {
                        Async.sleep(that.interval, done);
                        return;
                    }
                    
                    var rows = (results || {}).results || [];
                    var numResults = rows.length;
                    for(var i = 0; i < numResults; i++) {
                        that.emit("data", {
                            result: rows[i], 
                            index: offset + i
                        });
                    }
                    
                    isDone = !numResults;
                    offset += numResults;
                    
                    done();
                }
            );
        },
        function(err) {
            if (err) {
                that._stopSearch();
                that.emit("error", err);
            }
            else {
                that.emit("end");
            }
        }
    );
};

module.exports = NormalSplunkStream;