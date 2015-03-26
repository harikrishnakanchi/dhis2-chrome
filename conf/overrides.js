define([], function() {
    var url = "/* @echo DHIS_URL */";
    var auth_header = "/* @echo DHIS_AUTH */";
    var metdataSyncInterval = "/* @echo METADATA_SYNC_INTERVAL */";

    return {
        "dhisPing": {
            "url": url + "/favicon.ico"
        },
        "dhis": {
            "url": url
        },
        "metadata": {
            "sync": {
                "intervalInMinutes": parseInt(metdataSyncInterval)
            }
        },
        "devMode": false
    };
});
