describe('The admin ', function() {

    beforeEach(function(){
    	browser.get('http://localhost:8081/#/dashboard');
    });

    it('should be able to view the manage project page', function() {
        var userName = element(by.id(username_textBox));
        var password = element(by.id(password_textBox));
        var projectLink = element(by.id(dashboard_project_link));
        var loginButton = element(by.id(login_button));
        var downloadDataButton = element(by.id(dashboard_download_data_link));
        
        userName.sendKeys(admin_username);
        password.sendKeys(admin_password);
        loginButton.click();
        expect(projectLink.getText()).toEqual('Projects');

        downloadDataButton.click();
        expect($('[ng-show=isSyncDone]').isDisplayed()).toBeTruthy();

        projectLink.click();
    });

});