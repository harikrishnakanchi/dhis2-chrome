require(["base/test/js/test.config"], function() {
    require(["app/app.config"], function() {
        require.config({
            deps: tests,
            callback: window.__karma__.start,
        });
    });
});