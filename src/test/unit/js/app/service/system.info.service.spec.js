define(['dhisUrl', 'angularMocks', 'systemInfoService', 'moment'], function (dhisUrl, mocks, SystemInfoService, moment) {
    describe('System Info Service', function () {
        var systemInfoService, http, httpBackend;

        beforeEach(mocks.inject(function ($http, $httpBackend) {
            http = $http;
            httpBackend = $httpBackend;
            systemInfoService = new SystemInfoService(http);
        }));

        afterEach(function () {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it('get system info server time', function () {
            var systemInfoResponse = {
                serverDate: '2017-01-19T06:04:49.208+0000'
            };
            httpBackend.expectGET(dhisUrl.systemInfo).respond(200, systemInfoResponse);

            systemInfoService.getServerDate().then(function (serverDate) {
                expect(serverDate).toEqual(moment(systemInfoResponse.serverDate).toISOString());
            });

            httpBackend.flush();
        });
    });
});
