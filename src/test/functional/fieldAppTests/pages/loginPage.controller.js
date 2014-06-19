setUpLoginData = function() {
    userName = element(by.id(username_textBox));
    passWord = element(by.id(password_textBox));
    loginButton = element(by.id(login_button));
    invalidLoginMsg = element(by.id(invalid_login_msg_id));
};

var login = function(username, password) {
    userName.sendKeys(username);
    passWord.sendKeys(password);

    loginButton.click();
    ptor.waitForAngular();
};

loginAsAdmin = function() {
    login(admin_username, admin_password);
};

loginAsDataEntryUser = function() {
    login(dataEntry_username, dataEntry_password);
};

loginAsApprover = function() {
    login(approver_level1_username, approver_level1_password);
};

loginWithInvalidCredentials = function() {
    login(incorrect_username, incorrect_password);

    expect(invalidLoginMsg.getText()).toEqual(invalid_login_error_msg);
    expect(loginButton.isPresent()).toBe(true);
};