define(['dhisUrl', 'angularMocks', 'systemInfoService', 'moment', 'timecop'], function (dhisUrl, mocks, SystemInfoService, moment, timecop) {
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
                expect(serverDate).toEqual('2017-01-19T06:04:49.208');
            });

            httpBackend.flush();
        });

        it('get current time if time returned by server is invalid', function () {
            var systemInfoResponse = {
                serverDate: 'Invalid Date'
            };
            var currentTime = moment('2017-01-18');
            Timecop.install();
            Timecop.freeze(currentTime);

            httpBackend.expectGET(dhisUrl.systemInfo).respond(200, systemInfoResponse);

            systemInfoService.getServerDate().then(function (serverDate) {
                expect(serverDate).toEqual(moment.utc(currentTime).format('YYYY-MM-DDThh:mm:ss.SSS'));
            });

            httpBackend.flush();
            Timecop.returnToPresent();
            Timecop.uninstall();
        });
    });
});
