// describe('The data entry user ', function() {

//     beforeEach(function(){
//     	browser.get('http://localhost:8081/#/dashboard');
//     });


//     it('should be able to login with correct password', function() {
//         var userName = element(by.id(username_textBox));
//         var password = element(by.id(password_textBox));
//         var logoutLink = element(by.id(logout_link));
//         var loginButton = element(by.id(login_button));
//         var dataEntryLink = element(by.id(dashboard_data_entry_link));

//         userName.sendKeys(dataEntry_username);
//         password.sendKeys(dataEntry_password);
        
//         console.log("reached");
//         loginButton.click();

//         expect(dataEntryLink.getText()).toEqual('Data Entry');

//         // projectLink.click();
//         // logoutLink.click();
//         // expect(loginButton.isPresent()).toBe(true);
//     });

//     // it('should not be able to login with incorrect password',function(){
//     // 	var userName = element(by.id(username_textBox));
//     //     var password = element(by.id(password_textBox));
//     //     var loginButton = element(by.id(login_button));
//     //     var invalidLoginMsg = element(by.id(invalid_login_msg_id));

//     //     userName.sendKeys(admin_username);
//     //     password.sendKeys(incorrect_password);
        
//     //     loginButton.click();
//     //     expect(invalidLoginMsg.getText()).toEqual(invalid_login_error_msg);
//     //     expect(loginButton.isPresent()).toBe(true);
//     // });
// });



