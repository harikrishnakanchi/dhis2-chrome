define([], function() {
    var url = "http://localhost:8888/dhis";

    return {
        "dhisPing": {
            "url": url + "/favicon.ico"
        },
        "dhis": {
            "url": url,
        },
        "devMode": false
    };
});