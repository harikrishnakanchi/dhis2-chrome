setUpLoginData = function() {
    userName = element(by.id(username_textBox));
    password = element(by.id(password_textBox));
    logoutLink = element(by.id(logout_link));
    loginButton = element(by.id(login_button));
    projectLink = element(by.id(dashboard_project_link));
    invalidLoginMsg = element(by.id(invalid_login_msg_id));
};

loginAsAdmin = function() {
    userName.sendKeys(admin_username);
    password.sendKeys(admin_password);

    loginButton.click();
    ptor.waitForAngular();

    expect(projectLink.getText()).toEqual('Projects');

    projectLink.click();
};

logout = function() {
    logoutLink.click();

    expect(loginButton.isPresent()).toBe(true);
};

loginAsAdminWithInvalidCredentials = function() {
    userName.sendKeys(admin_username);
    password.sendKeys(incorrect_password);
    loginButton.click();

    expect(invalidLoginMsg.getText()).toEqual(invalid_login_error_msg);
    expect(loginButton.isPresent()).toBe(true);
};