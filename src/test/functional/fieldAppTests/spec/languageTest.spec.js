// describe('The user ', function() {

//     beforeEach(function() {
//         browser.get('http://localhost:8081/index.html#/dashboard');
//     });

//     it('should be able to set the language preference in field app', function() {
//         var selectLanguageButton = element(by.id('languageSelectButton'));

//         loginAsAdmin();

//         selectDropdownbyNum = function(element, optionNum) {
//             if (optionNum) {
//                 var options = element.findElements(by.tagName('option'))
//                     .then(function(options) {
//                         options[optionNum].click();
//                     });
//             }
//         };

//         selectDropdownbyNum(selectLanguageButton, 1);

//         expect(projectLink.getText()).toEqual('Les projets');

//         selectDropdownbyNum(selectLanguageButton, 0);

//         logout();
//     });

// });