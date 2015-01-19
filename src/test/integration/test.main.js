require(["base/main/js/app/app.config", "base/main/js/app/bg.config"], function() {
    require(["base/test/integration/test.config", "base/main/js/app/conf/properties", "base/main/js/app/test.app"], function(___, properties, testApp) {
        extendChromeFunctionality();
        return testApp.bootstrap(testApp.init()).then(function(data) {
            var injector = data[0];
            window.dhis = {
                "injector": injector
            };
            require.config({
                deps: tests,
                callback: window.__karma__.start,
            });
        });
    });
});


var extendChromeFunctionality = function() {
    chrome.runtime.onMessage = {
        "addListener": function(messageName, callback) {
            document.addEventListener(messageName, callback);
        }
    };

    chrome.runtime.sendMessage = function(msg) {
        var event = new CustomEvent(msg.message, {
            'detail': msg.requestId
        });
        document.dispatchEvent(event);
    };

    chrome.alarms = {
        "create": function() {},
        "onAlarm": {
            "addListener": function(callback) {
                callback.apply(null, [{
                    "name": "metadataSyncAlarm"
                }]);
                callback.apply(null, [{
                    "name": "projectDataSyncAlarm"
                }]);
            }
        }
    };
};