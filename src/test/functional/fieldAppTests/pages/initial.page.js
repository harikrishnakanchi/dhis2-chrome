var InitialPage = function () {
    this.initialize = function() {
        browser.get('http://localhost:8081');
    };

    this.getTitle = function () {
        return browser.driver.getTitle();
    };
};
module.exports = InitialPage;