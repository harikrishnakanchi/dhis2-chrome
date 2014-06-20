 loginPage = function() {

     var setUpLoginData = function() {
         userName = element(by.id(username_textBox));
         passWord = element(by.id(password_textBox));
         loginButton = element(by.id(login_button));
         invalidLoginMsg = element(by.id(invalid_login_msg_id));
     },

     var login = function(username, password) {
         loginPage.setUpLoginData();
         userName.sendKeys(username);
         passWord.sendKeys(password);

         loginButton.click();
         ptor.waitForAngular();
     },

     var verifyInvalidLogin = function() {
         loginPage.setUpLoginData();
         expect(invalidLoginMsg.getText()).toEqual(invalid_login_error_msg);
         expect(loginButton.isPresent()).toBe(true);
     }

     return {
         "setUpLoginData": setUpLoginData,
         "login": login,
         "verifyInvalidLogin": verifyInvalidLogin
     }
 };