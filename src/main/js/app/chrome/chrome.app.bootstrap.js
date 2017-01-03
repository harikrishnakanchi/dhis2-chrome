require.config({
    baseUrl: "js/"
});

require(["app/chrome/chrome.app.config", "app/shared.app.config"], function(config) {
    require(["app/app", "moment"], function(app, moment) {
        window.moment = moment;
        app.bootstrap(app.init());
    });
});