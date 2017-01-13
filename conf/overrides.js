define([], function() {
    var url = '<%= DHIS_URL %>';
    var metdataSyncInterval = '<%= METADATA_SYNC_INTERVAL %>';
    var passphrase = '<%= PASSPHRASE %>';
    var iter = parseInt('<%= ITER %>');
    var ks = parseInt('<%= KS %>');
    var ts = parseInt('<%= TS %>');
    var supportEmail = '<%= SUPPORT_EMAIL %>';

    return {
        dhisPing: {
            url: url + '/favicon.ico'
        },
        dhis: {
            url: url
        },
        metadata: {
            sync: {
                intervalInMinutes: parseInt(metdataSyncInterval)
            }
        },
        queue: {
            retryDelayConfig: {
                0: 0,
                1: 300000,
                2: 1800000
            }
        },
        encryption: {
            passphrase: passphrase,
            iter: iter,
            ks: ks,
            ts: ts
        },
        devMode: false,
        support_email: supportEmail
    };
});
