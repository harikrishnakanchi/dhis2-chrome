define(["downloadDataController", "angularMocks", "utils", "lodash", "platformUtils", "hustlePublishUtils"],
    function(DownloadDataController, mocks, utils, _, platformUtils, hustlePublishUtils) {
        describe("downloadDataController", function() {
            var q, hustle, downloadDataController, scope;

            beforeEach(module("hustle"));

            beforeEach(mocks.inject(function($rootScope, $q, $hustle) {
                q = $q;
                scope = $rootScope.$new();
                hustle = $hustle;

                scope.resourceBundle = {};
                scope.locale = 'someLocale';

                spyOn(hustle, "publishOnce").and.returnValue(utils.getPromise(q, {}));
                spyOn(platformUtils, "createNotification").and.returnValue(utils.getPromise(q, {}));

                spyOn(hustlePublishUtils, 'publishDownloadProjectData');

                downloadDataController = new DownloadDataController(scope, hustle, q);
            }));

            it("should fetch data from DHIS", function() {
                scope.syncNow();
                scope.$apply();

                var getHustleMessage = function(type) {
                    return {
                        type: type,
                        data: [],
                        locale: scope.locale
                    };
                };

                expect(hustle.publishOnce.calls.argsFor(0)).toEqual([getHustleMessage("downloadMetadata"), "dataValues"]);
                expect(hustlePublishUtils.publishDownloadProjectData).toHaveBeenCalled();
                expect(platformUtils.createNotification).toHaveBeenCalled();
            });
        });
    });
