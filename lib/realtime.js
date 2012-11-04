var BaseSplunkStream = require('./base')
var inherits = require('util').inherits;
var Async = require('splunk-sdk').Async;

var RealTimeSplunkStream = function() {
    return BaseSplunkStream.apply(this, arguments);
};

inherits(RealTimeSplunkStream, BaseSplunkStream);

RealTimeSplunkStream.prototype.loop = function() {
    var that = this;
    Async.whilst(
        function() { return !that.destroyed && that.search; },
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
            
            job.preview(
                {
                    output_time_format: "%s",
                    output_mode: "json_rows"    
                },
                function(err, results) {
                    if (err) {
                        done(err);
                        return;
                    }
                    else if (that.paused || !results || !results.rows || !results.rows.length) {
                        Async.sleep(that.interval, done);
                        return;
                    }
                    
                    that.emit("data", results);
                    Async.sleep(that.interval, done);
                }
            );
        },
        function(err) {
            if (err) {
                that._stopSearch();
                that.emit("error", err);
            }
        }
    );
};

module.exports = RealTimeSplunkStream;