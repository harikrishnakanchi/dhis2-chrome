describe('dashboard', function() {
    it('should display projects link', function() {
        browser.get('http://localhost:8081/#/dashboard');

        var projectLink = element(by.id("projects"));

        expect(projectLink.getText()).toEqual('Projects');
    });
});