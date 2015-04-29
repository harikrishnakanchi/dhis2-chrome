define(["dashboardController", "angularMocks", "utils", "lodash"],
    function(DashboardController, mocks, utils, _) {
        describe("dashboard controller", function() {
            var q, rootScope, hustle, dashboardController, timeout;

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

                rootScope.hasRoles = function(args) {
                    if (args[0] === "Superuser")
                        return false;
                    else
                        return true;
                };

                dashboardController = new DashboardController(scope, hustle, q, rootScope, timeout);
            }));

            it("should fetch and display all organisation units", function() {
                scope.syncNow();

                scope.$apply();
                timeout.flush();

                var syncableTypes = ["downloadMetadata", "downloadSystemSetting", "downloadPatientOriginDetails", "downloadOrgUnit", "downloadOrgUnitGroups",
                    "downloadProgram", "downloadData", "downloadEventData", "downloadDatasets"
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
            });
        });
    });
