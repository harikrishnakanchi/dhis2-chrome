define(["downloadDataController", "angularMocks", "utils", "lodash", "chromeUtils"],
    function(DownloadDataController, mocks, utils, _, chromeUtils) {
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
                spyOn(chromeUtils, "createNotification").and.returnValue(utils.getPromise(q, {}));

                rootScope.hasRoles = function(args) {
                    if (args[0] === "Projectadmin")
                        return false;
                    else
                        return true;
                };

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

                expect(hustle.publishOnce.calls.count()).toEqual(2);
                expect(hustle.publishOnce.calls.argsFor(0)).toEqual([getHustleMessage("downloadMetadata"), "dataValues"]);
                expect(hustle.publishOnce.calls.argsFor(1)).toEqual([getHustleMessage("downloadProjectData"), "dataValues"]);
                expect(chromeUtils.createNotification).toHaveBeenCalled();
            });
        });
    });
