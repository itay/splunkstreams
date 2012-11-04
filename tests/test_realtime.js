var SplunkStreams = require('../index');
var splunkjs = require('splunk-sdk');

var service = new splunkjs.Service({
    host: "localhost",
    port: 4089, 
    username: "admin",
    password: "changeme",
    version: "5.0"
});

var searchOptions = {
    search: "search index=_internal | head 1000 | stats count by sourcetype",
    earliest_time: "rt-5m",
    latest_time: "rt"
};

var stream = new SplunkStreams.RealTime(service, searchOptions);
stream.on("error", function(err) {
    console.log("Error", err.data.messages);
});

stream.on("data", function() {
    console.log("data", arguments); 
});

stream.connect();
setTimeout(function() {
    console.log("ENDING");
    stream.end(); 
}, 5000);