describe('The admin ', function() {

    beforeEach(function(){
    	browser.get('http://localhost:8081/#/dashboard');
    });


    it('should be able to login with correct password', function() {
        var userName = element(by.id(username_textBox));
        var password = element(by.id(password_textBox));
        var logoutLink = element(by.id(logout_link));
        var loginButton = element(by.id(login_button));
        var projectLink = element(by.id(dashboard_project_link));

        userName.sendKeys(admin_username);
        password.sendKeys(admin_password);
        loginButton.click();

        expect(projectLink.getText()).toEqual('Projects');

        projectLink.click();
        logoutLink.click();
        expect(loginButton.isPresent()).toBe(true);
    });

    it('should not be able to login with incorrect password',function(){
    	var userName = element(by.id(username_textBox));
        var password = element(by.id(password_textBox));
        var loginButton = element(by.id(login_button));
        var invalidLoginMsg = element(by.id(invalid_login_msg_id));

        userName.sendKeys(admin_username);
        password.sendKeys(incorrect_password);
        
        loginButton.click();
        expect(invalidLoginMsg.getText()).toEqual(invalid_login_error_msg);
        expect(loginButton.isPresent()).toBe(truech);
    });
});



