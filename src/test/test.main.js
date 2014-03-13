require(["base/test/test.config"], function() {
    require(["app/app.config"], function() {
        require.config({
            deps: tests,
            callback: window.__karma__.start,
        });
    });
});