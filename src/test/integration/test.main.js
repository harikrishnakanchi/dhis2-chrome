require(["base/test/integration/test.config"], function() {
    require(["app/app.config", "app/bg.config", "app/test.app"], function(_, __, testApp) {
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
