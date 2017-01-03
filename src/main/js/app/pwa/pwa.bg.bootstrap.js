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
self.basePath = "../../../";

require.config({
    baseUrl: "../../../js/",
    waitSeconds: 0
});

require(["app/pwa/pwa.bg.config", "app/shared.bg.config"], function() {
    require(["app/bg.app"], function(app) {
        require(["platformUtils", "lodash"], function(platformUtils, _) {
            var onDbReady = function() {
                console.log("DB Ready");
                app.bootstrap(app.init());
            };
            platformUtils.init();
            platformUtils.addListener("dbReady", _.once(onDbReady));
            platformUtils.sendMessage("backgroundReady");
        });
    });
});
