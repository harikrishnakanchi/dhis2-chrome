define([], function() {
    var url = "/* @echo DHIS_URL */";
    var auth_header = "/* @echo DHIS_AUTH */";

    return {
        "dhisPing": {
            "url": url + "/favicon.ico"
        },
        "dhis": {
            "url": url,
            "auth_header": auth_header
        },
        "devMode": false
    };
});
