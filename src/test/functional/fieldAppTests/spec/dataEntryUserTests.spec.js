var fs = require('fs');

describe('The data entry user ', function() {

    beforeEach(function() {
        ptor = protractor.getInstance();
        browser.get('http://localhost:8081/index.html#/dashboard');
        
        setUpLoginData();
        setUpDashboardData();
    });

    afterEach(function() {
        var currentSpec = jasmine.getEnv().currentSpec,
            passed = currentSpec.results().passed();
        if (!passed) {
            browser.takeScreenshot().then(function(png) {
                browser.getCapabilities().then(function(capabilities) {
                    var browserName = capabilities.caps_.browserName,
                        filename = currentSpec.description + '.png';
                    writeScreenShot(png, filename);
                });
            });
        }
    });

    function writeScreenShot(data, filename) {
        var stream = fs.createWriteStream("screenShots/" + filename);
        stream.write(new Buffer(data, 'base64'));
        stream.end();
    }

    
    it('should be able to login with correct password', function() {
        loginAsDataEntryUser();
        verifyDataEntryUserLogin();
        verifyDownloadData();
        logout();
    });

});