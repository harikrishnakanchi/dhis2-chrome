define(["downloadDataController", "angularMocks", "utils", "lodash", "chromeUtils"],
    function(DownloadDataController, mocks, utils, _, chromeUtils) {
        describe("downloadDataController", function() {
            var q, rootScope, hustle, downloadDataController, timeout;

            beforeEach(module("hustle"));

            beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout) {
                q = $q;
                scope = $rootScope.$new();
                hustle = $hustle;
                rootScope = $rootScope;
                timeout = $timeout;

                scope.resourceBundle = {
                    "syncRunning": "syncRunning"
                };

                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
                spyOn(chromeUtils, "createNotification").and.returnValue(utils.getPromise(q, {}));

                rootScope.hasRoles = function(args) {
                    if (args[0] === "Superuser")
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

                var syncableTypes = [
                    "downloadMetadata",
                    "downloadSystemSetting",
                    "downloadPatientOriginDetails",
                    "downloadOrgUnit",
                    "downloadOrgUnitGroups",
                    "downloadProgram",
                    "downloadData",
                    "downloadEventData",
                    "downloadDatasets",
                    "downloadCharts",
                    "downloadReferralLocations",
                    "downloadPivotTables"
                ];

                var expectedHustleArgs = _.map(syncableTypes, function(type) {
                    return [{
                        "type": type,
                        "data": []
                    }, "dataValues"];
                });

                expect(hustle.publish.calls.count()).toEqual(syncableTypes.length);
                _.forEach(syncableTypes, function(type, i) {
                    expect(hustle.publish.calls.argsFor(i)).toEqual(expectedHustleArgs[i]);
                });
                expect(chromeUtils.createNotification).toHaveBeenCalled();
            });
        });
    });