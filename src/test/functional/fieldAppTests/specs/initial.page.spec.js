var InitialPage = require("../pages/initial.page");
describe('Product key page', function() {
    it('should set product key', function(done) {
        var initialPage = new InitialPage();
        initialPage.initialize();
        initialPage.getTitle().then(function (title) {
            expect(title).toEqual('PRAXIS');
            done();
        });
    });
});