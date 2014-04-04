require(["base/test/test.config"], function() {
    require(["app/app.config", "app/background.config"], function() {
        require.config({
            deps: tests,
            callback: window.__karma__.start,
        });
    });
});