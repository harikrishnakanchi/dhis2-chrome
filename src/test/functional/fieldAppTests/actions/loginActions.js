loginAsAdmin = function() {

    loginPage.login(admin_username, admin_password);
};

loginAsDataEntryUser = function() {
    loginPage.login(dataEntry_username, dataEntry_password);
};

loginAsApprover = function() {
    loginPage.login(approver_level1_username, approver_level1_password);
};

loginWithInvalidCredentials = function() {
    loginPage.login(incorrect_username, incorrect_password);

    expect(invalidLoginMsg.getText()).toEqual(invalid_login_error_msg);
    expect(loginButton.isPresent()).toBe(true);
};