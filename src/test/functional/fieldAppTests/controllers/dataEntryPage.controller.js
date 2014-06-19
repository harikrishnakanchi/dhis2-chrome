setUpDataEntryPageData = function() {
    logoutLink = element(by.id(logout_link));
    yearDropdown = element(by.id(year_dropdown_id));
    monthDropdown = element(by.id(month_dropdown_id));
    weekDropdown = element(by.id(week_dropdown_id));
    moduleDropdown = element(by.id(module_dropdown_id));
    saveButton = element(by.id(save_button_id));
    submitButton = element(by.id(submit_button_id));
};


verifyUserOnDataEntryPage = function() {
    selectDropdownbyNum(moduleDropdown, 0);
    expect((saveButton).isDisplayed()).toBeTruthy();

};

var selectDropdownbyNum = function(element, optionNum) {
    if (optionNum) {
        var options = element.findElements(by.tagName('option'))
            .then(function(options) {
                options[optionNum].click();
            });
    }
};