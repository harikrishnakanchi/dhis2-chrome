describe('The admin ', function() {

    beforeEach(function(){
    	browser.get('http://localhost:8081/#/dashboard');
    });

    // afterEach(function(){
    // 	var logout = element(by.id(logout_link));
    // 	if(isElementPresent(logout))
    //         logout.click();
    // });

    it('should be able to view the manage project page', function() {

        var userName = element(by.id(username_textBox));
        var password = element(by.id(password_textBox));
        var projectLink = element(by.id(dashboard_project_link));
        var loginButton = element(by.id(login_button));

        userName.sendKeys(admin_username);
        password.sendKeys(admin_password);
        loginButton.click();


        expect(projectLink.getText()).toEqual('Projects');

        projectLink.click();

    });

});