setUpDashboardData = function() {
    logoutLink = element(by.id(logout_link));
    projectLink = element(by.id(dashboard_project_link));
    dataEntryButton = element(by.id(dashboard_data_entry_link));
    dataApprovalButton = element(by.id(dashboard_data_approval_button));
    downloadDataButton = element(by.id(dashboard_download_data_link));
    loggedInUser = element(by.id(logged_in_user));
};


verifyAdminLogin = function(){
    expect(loggedInUser.getText()).toEqual(admin_username);
    expect(projectLink.getText()).toEqual('Projects');
    expect(downloadDataButton.getText()).toEqual('Download All Data');
};

verifyDataEntryUserLogin = function(){
    expect(dataEntryButton.getText()).toEqual('Data Entry');
    expect(downloadDataButton.getText()).toEqual('Download All Data');
    expect(loggedInUser.getText()).toEqual(dataEntry_username);
};

verifyApproverLogin = function(){
    expect(dataApprovalButton.getText()).toEqual("Approve data");
    expect(downloadDataButton.getText()).toEqual('Download All Data');
    expect(loggedInUser.getText()).toEqual(approver_level1_username);
};

verifyDownloadData =function(){
    downloadDataButton.click();
    expect($('[ng-show=isSyncDone]').isDisplayed()).toBeTruthy();
};

navigateToManageProjectPage = function(){
        projectLink.click();
};

logout = function() {
    logoutLink.click();
    expect(loginButton.isPresent()).toBe(true);
};

