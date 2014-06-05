setUpLoginData = function() {
    userName = element(by.id(username_textBox));
    password = element(by.id(password_textBox));
    logoutLink = element(by.id(logout_link));
    loginButton = element(by.id(login_button));
    projectLink = element(by.id(dashboard_project_link));
    invalidLoginMsg = element(by.id(invalid_login_msg_id));
    loggedInUser = element(by.id(logged_in_user));
    downloadDataButton = element(by.id(dashboard_download_data_link));
};

loginAsAdmin = function() {
    userName.sendKeys(admin_username);
    password.sendKeys(admin_password);

    loginButton.click();
    ptor.waitForAngular();

    expect(projectLink.getText()).toEqual('Projects');
    expect(downloadDataButton.getText()).toEqual('Download All Data');
    expect(loggedInUser.getText()).toEqual(admin_username);
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