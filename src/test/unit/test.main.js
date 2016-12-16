require(["base/test/unit/test.config"], function() {
    require(["app/pwa/pwa.app.config", "app/pwa/pwa.bg.config", "app/shared.app.config", "app/shared.bg.config"], function() {
        require.config({
            deps: tests,
            callback: window.__karma__.start
        });
    });
});