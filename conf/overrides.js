define([], function() {
    var url = "/* @echo DHIS_URL */";
    var metdataSyncInterval = "/* @echo METADATA_SYNC_INTERVAL */";
    var passphrase = "/* @echo PASSPHRASE */";
    var iter = parseInt("/* @echo ITER */");
    var ks = parseInt("/* @echo KS */");
    var ts = parseInt("/* @echo TS */");
    var supportEmail = "/* @echo SUPPORT_EMAIL */";

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
        "encryption": {
            "passphrase": passphrase,
            "iter": iter,
            "ks": ks,
            "ts": ts
        },
        "devMode": false,
        "support_email": supportEmail
    };
});
