setUpLoginData = function() {
    userName = element(by.id(username_textBox));
    passWord = element(by.id(password_textBox));
    logoutLink = element(by.id(logout_link));
    loginButton = element(by.id(login_button));
    projectLink = element(by.id(dashboard_project_link));
    invalidLoginMsg = element(by.id(invalid_login_msg_id));
    loggedInUser = element(by.id(logged_in_user));
    downloadDataButton = element(by.id(dashboard_download_data_link));
    dataEntryButton = element(by.id(dashboard_data_entry_link));
    dataApprovalButton = element(by.id(dashboard_data_approval_button));
};

var login = function(username, password) {
    userName.sendKeys(username);
    passWord.sendKeys(password);

    loginButton.click();
    ptor.waitForAngular();
};

logout = function() {
    logoutLink.click();

    expect(loginButton.isPresent()).toBe(true);
};

loginAsAdmin = function() {
    login(admin_username, admin_password);

    expect(loggedInUser.getText()).toEqual(admin_username);
    expect(projectLink.getText()).toEqual('Projects');
    expect(downloadDataButton.getText()).toEqual('Download All Data');
};

loginAsDataEntryUser = function() {
    login(dataEntry_username, dataEntry_password);

    expect(dataEntryButton.getText()).toEqual('Data Entry');
    expect(downloadDataButton.getText()).toEqual('Download All Data');
    expect(loggedInUser.getText()).toEqual(dataEntry_username);
};

loginAsApprover = function() {
    login(approver_level1_username, approver_level1_password);

    expect(downloadDataButton.getText()).toEqual('Download All Data');
    expect(dataApprovalButton.getText()).toEqual("Approve Data");
    expect(loggedInUser.getText()).toEqual(approver_level1_username);
};

loginWithInvalidCredentials = function() {
    login(admin_username, incorrect_password);

    expect(invalidLoginMsg.getText()).toEqual(invalid_login_error_msg);
    expect(loginButton.isPresent()).toBe(true);
};