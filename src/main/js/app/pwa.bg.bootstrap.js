console.log('Setting up web worker');

importScripts('/js/lib/requirejs/require.js');

var window = self;
self.history = {};
self.Node = function () {};
var document = {
    readyState: 'complete',
    cookie: '',
    querySelector: function () {},
    createElement: function () {
        return {
            pathname: '',
            setAttribute: function () {}
        };
    }
};

require.config({
    baseUrl: "/js/"
});

require(["app/bg.pwa.config", "app/bg.shared.config"], function(config) {
    require(["app/bg.app"], function(app) {
        require(["chromeUtils"], function(chromeUtils) {
            var bootstrapData;
            var onDbReady = function(request, sender, sendResponse) {
                if (!bootstrapData && request === "dbReady") {
                    console.log("dB ready");
                    app.bootstrap(app.init()).then(function(data) {
                        bootstrapData = data;
                    });
                }
            };

            chromeUtils.addListener(onDbReady);
        });
    });
});
