define(["downloadDataController", "angularMocks", "utils", "lodash", "platformUtils", "hustlePublishUtils"],
    function(DownloadDataController, mocks, utils, _, platformUtils, hustlePublishUtils) {
        describe("downloadDataController", function() {
            var q, rootScope, hustle, downloadDataController, timeout, scope;

            beforeEach(module("hustle"));

            beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout) {
                q = $q;
                scope = $rootScope.$new();
                hustle = $hustle;
                rootScope = $rootScope;
                timeout = $timeout;

                scope.resourceBundle = {};
                scope.locale = 'someLocale';

                spyOn(hustle, "publishOnce").and.returnValue(utils.getPromise(q, {}));
                spyOn(platformUtils, "createNotification").and.returnValue(utils.getPromise(q, {}));

                rootScope.hasRoles = function(args) {
                    if (args[0] === "Projectadmin")
                        return false;
                    else
                        return true;
                };

                spyOn(hustlePublishUtils, 'publishDownloadProjectData').and.callThrough();

                downloadDataController = new DownloadDataController(scope, hustle, q, rootScope, timeout);
            }));

            it("should fetch data from DHIS", function() {
                scope.syncNow();

                scope.$apply();
                timeout.flush();

                var getHustleMessage = function(type) {
                    return {
                        type: type,
                        data: [],
                        locale: scope.locale
                    };
                };

                expect(hustle.publishOnce.calls.count()).toEqual(5);
                expect(hustle.publishOnce.calls.argsFor(0)).toEqual([getHustleMessage("downloadMetadata"), "dataValues"]);
                expect(hustlePublishUtils.publishDownloadProjectData).toHaveBeenCalled();
                expect(platformUtils.createNotification).toHaveBeenCalled();
            });
        });
    });
