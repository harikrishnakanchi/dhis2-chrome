require(["base/main/js/app/app.config", "base/main/js/app/bg.config"], function() {
    require(["base/test/integration/test.config", "base/main/js/app/conf/properties", "base/main/js/app/test.app"], function(___, properties, testApp) {
        // properties.dhis.url = "http://localhost:8888/dhis"
        console.error(properties);

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

    chrome.runtime.sendMessage = function(messageName) {
        var event = new Event(messageName);
        document.dispatchEvent(event);
    };
};
