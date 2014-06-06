// describe('The data entry user ', function() {

//     beforeEach(function() {
//         ptor = protractor.getInstance();
//         browser.get('http://localhost:8081/index.html#/dashboard');
//         setUpLoginData();
//     });


//     xit('should be able to enter data', function() {
//         var datasetSectionButton = element(by.id(acc));
//         var selectButton = element(by.id(module_select));

//         loginAsDataEntryUser();
//         dataEntryButton.click();

//         selectDropdownbyNum = function(element, optionNum) {
//             if (optionNum) {
//                 var options = element.findElements(by.tagName('option'))
//                     .then(function(options) {
//                         options[optionNum].click();
//                     });
//             }
//         };

//         selectDropdownbyNum(selectButton, 2);
//         ptor.waitForAngular();

//         expect(datasetSectionButton.getText()).toEqual('Sex at admission');
//         datasetSectionButton.click();

//         // var box1 = element(by.id('datafield_2'));
//         // box1.sendKeys('1');

//         // var save = element(by.id('dataEntrySubmit'));
//         // save.click();


//     });

// });