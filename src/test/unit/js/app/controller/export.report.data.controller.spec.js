define(['exportReportDataController', 'angularMocks'], function(ExportReportDataController, mocks) {
    describe('ExportReportDataController', function() {
        var controller, rootScope, scope;

        beforeEach(mocks.inject(function($rootScope) {
            rootScope = $rootScope;
            scope = rootScope.$new();

            controller = new ExportReportDataController(scope);
        }));
    });
});