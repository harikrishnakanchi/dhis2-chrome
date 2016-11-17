require(["base/test/unit/test.config"], function() {
    require(["app/chrome.app.config", "app/chrome.bg.config", "app/shared.app.config", "app/shared.bg.config"], function() {
        require.config({
            deps: tests,
            callback: window.__karma__.start
        });
    });
});