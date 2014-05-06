define(["projectController", "angularMocks", "utils", "lodash", "moment"], function(ProjectController, mocks, utils, _, moment) {

    describe("project controller tests", function() {

        var scope, timeout, q, location, orgUnitService, anchorScroll, orgunitMapper;

        beforeEach(mocks.inject(function($rootScope, $q, $timeout, $location) {
            scope = $rootScope.$new();
            q = $q;
            timeout = $timeout;
            location = $location;

            orgUnitMapper = {
                getChildOrgUnitNames: function() {}
            };

            orgUnitService = {
                "create": function() {},
                "getAll": function() {
                    return utils.getPromise(q, {});
                }
            };

            scope.isEditMode = true;
            scope.orgUnit = {
                id: "blah"
            };

            anchorScroll = jasmine.createSpy();
            projectController = new ProjectController(scope, orgUnitService, q, location, timeout, anchorScroll);
        }));

        it("should save project in dhis", function() {
            var orgUnitId = 'a4acf9115a7';

            var newOrgUnit = {
                'name': 'Org1',
                'location': 'Some Location',
                'openingDate': moment().toDate(),
                'endDate': moment().add('days', 7).toDate(),
            };

            var parent = {
                'name': 'Name1',
                'id': 'Id1',
                'level': 2,
            };

            spyOn(orgUnitService, 'create').and.returnValue(utils.getPromise(q, orgUnitId));
            spyOn(location, 'hash');

            scope.save(newOrgUnit, parent);
            scope.$apply();

            var expectedNewOrgUnit = [{
                id: orgUnitId,
                name: newOrgUnit.name,
                shortName: newOrgUnit.name,
                level: 3,
                openingDate: moment(newOrgUnit.openingDate).format("YYYY-MM-DD"),
                parent: {
                    id: parent.id,
                    name: parent.name,
                },
                "attributeValues": [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Project"
                }, {
                    "attribute": {
                        "code": "prjCon",
                        "name": "Context",
                        "id": "Gy8V8WeGgYs"
                    },
                    "value": newOrgUnit.context
                }, {
                    "attribute": {
                        "code": "prjLoc",
                        "name": "Location",
                        "id": "CaQPMk01JB8"
                    },
                    "value": newOrgUnit.location
                }, {
                    "attribute": {
                        "code": "prjType",
                        "name": "Type of project",
                        "id": "bnbnSvRdFYo"
                    },
                    "value": newOrgUnit.projectType
                }, {
                    "attribute": {
                        "code": "prjPopType",
                        "name": "Type of population",
                        "id": "Byx9QE6IvXB"
                    },
                    "value": newOrgUnit.populationType
                }, {
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date",
                        "id": "ZbUuOnEmVs5"
                    },
                    "value": moment(newOrgUnit.endDate).format("YYYY-MM-DD")
                }],
            }];

            expect(orgUnitService.create).toHaveBeenCalledWith(expectedNewOrgUnit);
        });

        it("should display error if saving organization unit fails", function() {
            var newOrgUnit = {};

            spyOn(orgUnitService, 'create').and.returnValue(utils.getRejectedPromise(q, {}));

            scope.save(newOrgUnit, parent);
            scope.$apply();

            expect(scope.saveFailure).toEqual(true);
        });

        xit("should reset form", function() {
            scope.newOrgUnit = {
                'id': '123',
                'openingDate': moment().add('days', -7).toDate(),
                'endDate': moment().add('days', 7).toDate(),
            };
            scope.saveSuccess = true;
            scope.saveFailure = true;

            scope.reset();
            scope.$apply();

            expect(scope.newOrgUnit).toEqual({
                openingDate: moment().toDate(),
            });
            expect(scope.saveSuccess).toEqual(false);
            expect(scope.saveFailure).toEqual(false);
        });

        it("should open the opening date datepicker", function() {
            var event = {
                preventDefault: function() {},
                stopPropagation: function() {}
            };
            spyOn(event, 'preventDefault');
            spyOn(event, 'stopPropagation');



            scope.openOpeningDate(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(scope.openingDate).toBe(true);
            expect(scope.endDate).toBe(false);
        });

        it("should open the end date datepicker", function() {
            var event = {
                preventDefault: function() {},
                stopPropagation: function() {}
            };
            spyOn(event, 'preventDefault');
            spyOn(event, 'stopPropagation');

            scope.openEndDate(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(scope.openingDate).toBe(false);
            expect(scope.endDate).toBe(true);
        });

        it("should show project details when in view mode", function() {
            scope.newOrgUnit = {};
            scope.orgUnit = {
                "name": "anyname",
                "openingDate": "2010-01-01",
                'level': 3,
                "attributeValues": [{
                    "attribute": {
                        "code": "prjCon",
                        "name": "Context",
                        "id": "Gy8V8WeGgYs"
                    },
                    "value": "val2"
                }, {
                    "attribute": {
                        "code": "prjLoc",
                        "name": "Location",
                        "id": "CaQPMk01JB8"
                    },
                    "value": "val3"
                }, {
                    "attribute": {
                        "code": "prjType",
                        "name": "Type of project",
                        "id": "bnbnSvRdFYo"
                    },
                    "value": "val4"
                }, {
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date",
                        "id": "ZbUuOnEmVs5"
                    },
                    "value": "2011-01-01"
                }, {
                    "attribute": {
                        "code": "prjPopType",
                        "name": "Type of population",
                        "id": "Byx9QE6IvXB"
                    },
                    "value": "val6"
                }]
            };
            var expectedNewOrgUnit = {
                'name': scope.orgUnit.name,
                'openingDate': moment("2010-01-01").toDate(),
                'context': "val2",
                'location': "val3",
                'projectType': "val4",
                'endDate': moment("2011-01-01").toDate(),
                'populationType': "val6",
            };

            scope.isEditMode = false;
            scope.$apply();

            projectController = new ProjectController(scope, orgUnitService, q, location, timeout, anchorScroll);

            expect(scope.newOrgUnit).toEqual(expectedNewOrgUnit);
        });

    });

});