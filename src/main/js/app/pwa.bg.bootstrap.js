console.log('Setting up web worker');

importScripts('../lib/requirejs/require.js');

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
self.worker = self;

require.config({
    baseUrl: "../../js/"
});

require(["app/bg.pwa.config", "app/bg.shared.config"], function() {
    require(["app/bg.app"], function(app) {
        require(["chromeUtils"], function(chromeUtils) {
            var bootstrapData;
            var onDbReady = function() {
                if (!bootstrapData) {
                    console.log("dB ready");
                    app.bootstrap(app.init()).then(function(data) {
                        bootstrapData = data;
                    });
                }
            };
            chromeUtils.init();
            chromeUtils.addListener("dbReady", onDbReady);
            self.worker.postMessage("backgroundReady");
        });
    });
});
