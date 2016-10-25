require(["base/test/unit/test.config"], function() {
    require(["app/app.config", "app/bg.config", "app/shared.config"], function() {
        require.config({
            deps: tests,
            callback: window.__karma__.start,
        });
    });
});