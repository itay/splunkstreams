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
    search: "search index=_internal | head 5004",
};

var stream = new SplunkStreams.Normal(service, searchOptions);
stream.on("error", function(err) {
    console.log("Error", err.data.messages);
});

stream.on("data", function(data) {
    console.log("data", data.result.sourcetype, data.index); 
});

stream.connect();

setTimeout(function() {
    console.log("pausing");
    stream.pause(); 
}, 1500);
setTimeout(function() {
    console.log("unpausing");
    stream.resume(); 
}, 5000);