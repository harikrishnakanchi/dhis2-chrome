define(["orgUnitRepository", "angularMocks", "projectBaselineReportsController", "utils"], function(OrgUnitRepository, mocks, ProjectBaselineReportsController, utils) {
    describe("projectBaselineReportsController", function() {
        var scope, rootScope, projectBaselineReportsController, orgUnitRepository;

        beforeEach(mocks.inject(function($rootScope, $q) {
            rootScope = $rootScope;

            rootScope.currentUser = {
                userCredentials: {
                    username: "test_user"
                },
                selectedProject: {
                    id: "xyz",
                    name: "test_project"
                }
            };

            scope = rootScope.$new();

            var projectBasicInfo = {
                "attributeValues": [
                    {
                        "attribute": {
                            "code": "prjCon",
                            "created": "2014-09-17T06:42:16.964+0000",
                            "id": "Gy8V8WeGgYs",
                            "lastUpdated": "2015-07-10T12:04:44.471+0000",
                            "name": "Context"
                        },
                        "created": "2016-03-17T03:44:13.140+0000",
                        "lastUpdated": "2016-03-17T03:44:13.438+0000",
                        "value": "Cross-border instability"
                    },
                    {
                        "attribute": {
                            "code": "projCode",
                            "created": "2014-09-17T06:42:16.977+0000",
                            "id": "fa5e00d5cd2",
                            "lastUpdated": "2015-07-10T12:04:44.474+0000",
                            "name": "Project Code"
                        },
                        "created": "2016-03-17T03:44:13.140+0000",
                        "lastUpdated": "2016-03-17T03:44:13.439+0000",
                        "value": "SS153"
                    },
                    {
                        "attribute": {
                            "code": "modeOfOperation",
                            "created": "2014-09-17T06:42:16.989+0000",
                            "id": "a048b89d331",
                            "lastUpdated": "2015-07-10T12:04:44.477+0000",
                            "name": "Mode Of Operation"
                        },
                        "created": "2016-03-17T03:44:13.140+0000",
                        "lastUpdated": "2016-03-17T03:44:13.428+0000",
                        "value": "Direct operation"
                    },
                    {
                        "attribute": {
                            "code": "projectType",
                            "created": "2015-07-10T11:56:15.776+0000",
                            "id": "uDpmgVfegal",
                            "lastUpdated": "2015-07-10T12:04:44.480+0000",
                            "name": "Project Type"
                        },
                        "created": "2016-03-17T03:44:13.140+0000",
                        "lastUpdated": "2016-03-17T03:44:13.445+0000",
                        "value": "Regular Project"
                    },
                    {
                        "attribute": {
                            "code": "modelOfManagement",
                            "created": "2014-09-17T06:42:16.987+0000",
                            "id": "d2c3e7993f6",
                            "lastUpdated": "2015-07-10T12:04:44.477+0000",
                            "name": "Model Of Management"
                        },
                        "created": "2016-03-17T03:44:13.140+0000",
                        "lastUpdated": "2016-03-17T03:44:13.442+0000",
                        "value": "Collaboration"
                    },
                    {
                        "attribute": {
                            "code": "Type",
                            "created": "2014-09-17T06:42:16.962+0000",
                            "id": "a1fa2777924",
                            "lastUpdated": "2015-07-10T12:04:44.471+0000",
                            "name": "Type"
                        },
                        "created": "2016-03-17T03:44:13.140+0000",
                        "lastUpdated": "2016-03-17T03:44:13.431+0000",
                        "value": "Project"
                    },
                    {
                        "attribute": {
                            "code": "prjPopType",
                            "created": "2014-09-17T06:42:16.969+0000",
                            "id": "Byx9QE6IvXB",
                            "lastUpdated": "2015-07-10T12:04:44.473+0000",
                            "name": "Type of population"
                        },
                        "created": "2016-03-17T03:44:13.140+0000",
                        "lastUpdated": "2016-03-17T03:44:13.443+0000",
                        "value": "General Population"
                    },
                    {
                        "attribute": {
                            "code": "reasonForIntervention",
                            "created": "2014-09-17T06:42:16.985+0000",
                            "id": "e7af7f29053",
                            "lastUpdated": "2015-07-10T12:04:44.476+0000",
                            "name": "Reason For Intervention"
                        },
                        "created": "2016-03-17T03:44:13.140+0000",
                        "lastUpdated": "2016-03-17T03:44:13.425+0000",
                        "value": "Access to health care"
                    },
                    {
                        "attribute": {
                            "code": "prjLoc",
                            "created": "2014-09-17T06:42:16.968+0000",
                            "id": "CaQPMk01JB8",
                            "lastUpdated": "2015-07-10T12:04:44.472+0000",
                            "name": "Location"
                        },
                        "created": "2016-03-17T03:44:13.140+0000",
                        "lastUpdated": "2016-03-17T03:44:13.433+0000",
                        "value": "Northern Bar El Ghazal"
                    }
                ],
                "id": "xyz",
                "name": "test_project",
                "openingDate": "2007-12-31",
                "parent": {
                    "created": "2014-09-17T06:42:20.668+0000",
                    "id": "a18da381f7d",
                    "lastUpdated": "2015-07-10T12:05:42.868+0000",
                    "name": "SOUDAN Sud"
                }
            };

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise($q, projectBasicInfo));

            projectBaselineReportsController = new ProjectBaselineReportsController(rootScope, scope, orgUnitRepository);
        }));

        it("should add the projectAttributes which lists all the project basic info into the scope", function() {
            expect(orgUnitRepository.get).toHaveBeenCalledWith("xyz");
            var expectedProjectAttributes = [
                {
                    name: "Country",
                    value: "SOUDAN Sud"
                }, {
                    name: "Name",
                    value: "test_project"
                }, {
                    name: 'Project Code',
                    value: 'SS153'
                },
                {
                    name: 'Project Type',
                    value: 'Regular Project'
                },
                {
                    name: 'Context',
                    value: 'Cross-border instability'
                },
                {
                    name: 'Type of population',
                    value: 'General Population'
                }, {
                    name: 'Reason For Intervention',
                    value: 'Access to health care'
                },
                {
                    name: 'Mode Of Operation',
                    value: 'Direct operation'
                }, {
                    name: 'Model Of Management',
                    value: 'Collaboration'
                },  {
                    name : "Opening Date",
                    value: "12/31/2007"
                },
                {
                    name : "End Date",
                    value: ""
                }
            ];
            scope.$apply();
            expect(_.isEqual(scope.projectAttributes, expectedProjectAttributes)).toBe(true);
        });

    });
});
