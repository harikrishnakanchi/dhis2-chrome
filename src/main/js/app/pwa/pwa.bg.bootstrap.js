console.log('Setting up web worker');

importScripts('../../lib/requirejs/require.js');

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
    baseUrl: "../../../js/"
});

require(["app/pwa/pwa.bg.config", "app/shared.bg.config"], function() {
    require(["app/bg.app"], function(app) {
        require(["platformUtils"], function(platformUtils) {
            var bootstrapData;
            var onDbReady = function() {
                if (!bootstrapData) {
                    console.log("dB ready");
                    app.bootstrap(app.init()).then(function(data) {
                        bootstrapData = data;
                    });
                }
            };
            platformUtils.init();
            platformUtils.addListener("dbReady", onDbReady);
            platformUtils.sendMessage("backgroundReady");
        });
    });
});
