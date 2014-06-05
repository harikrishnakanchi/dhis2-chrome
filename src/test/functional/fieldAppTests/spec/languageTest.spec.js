// describe('The user ', function() {

//     beforeEach(function(){
//     	browser.get('http://localhost:8081/#/dashboard');
//     });

//     it('is able to set the language preference in field app', function() {
//         var userName = element(by.id(username_textBox));
//         var password = element(by.id(password_textBox));
//         var projectLink = element(by.id(dashboard_project_link));
//         var loginButton = element(by.id(login_button));
//         var downloadDataButton = element(by.id(dashboard_download_data_link));
        
//         userName.sendKeys(admin_username);
//         password.sendKeys(admin_password);
//         loginButton.click();
//         expect(projectLink.getText()).toEqual('Projects');

//         // var options = element(by.tagName('option'));
//         // options.click();
//         // options.sendKeys('Fr');


//   var selectDropdownbyNum = function ( element, 'fr') {
//     if ('fr'){
//         var options = element(by.tagName('option'));
//         .then(function(options){
//           options['fr'].click();
//         });
//     }
//   };








//         expect(projectLink.getText()).toEqual('Les projets');
//     });

// });



//         //   selectDropdownbyNum: { value: function ( element, optionNum ) {
//         //     if (optionNum){
//         //         var options = element.findElements(by.tagName('option'))   
//         //         .then(function(options){
//         //         options[optionNum].click();
//         //         });
//         //     }
//         // }}