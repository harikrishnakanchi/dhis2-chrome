describe('The admin ', function() {

    beforeEach(function() {
        ptor = protractor.getInstance();
        browser.get('http://localhost:8081/index.html#/dashboard');
        setUpLoginData();
    });

    it('should be able to view the manage project page', function() {
        loginAsAdmin();

        projectLink.click();

        logout();
    });

    it("should be able to download data", function() {
        var downloadDataButton = element(by.id(dashboard_download_data_link));

        loginAsAdmin();
        downloadDataButton.click();

        expect($('[ng-show=isSyncDone]').isDisplayed()).toBeTruthy();
    });

});