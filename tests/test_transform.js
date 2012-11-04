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
var transformStream = new SplunkStreams.Transform(function(data, emit) {
     emit(data.index + ": " + data.result.sourcetype + "\n");
     
     if (data.index === 3321) {
        setTimeout(function() {
            console.log("RESUMING");
            transformStream.resume();
        }, 2000)
        return false;
     }
     
     return
});

stream.pipe(transformStream).pipe(process.stdout);

stream.connect();