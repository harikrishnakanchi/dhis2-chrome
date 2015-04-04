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
        "queue": {
            "retryDelayConfig": {
                0: 900000,
                1: 900000,
                2: 1800000,
                3: 43200000,
                4: 43200000
            }
        },
        "devMode": false
    };
});
