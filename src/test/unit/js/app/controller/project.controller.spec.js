define(["projectController", "angularMocks", "utils", "lodash", "moment"], function(ProjectController, mocks, utils, _, moment) {

    describe("project controller tests", function() {

        var scope, timeout, q, location, db, mockOrgStore, orgUnitService, anchorScroll;

        beforeEach(mocks.inject(function($rootScope, $q, $timeout, $location) {
            scope = $rootScope.$new();
            timeout = $timeout;
            q = $q;
            location = $location;

            mockOrgStore = {
                upsert: function() {}
            };

            db = {
                objectStore: function(store) {
                    return mockOrgStore;
                }
            };

            orgUnitService = {
                "create": function() {}
            };

            anchorScroll = jasmine.createSpy();
            scope.isEditMode = true;
            projectController = new ProjectController(scope, db, orgUnitService, q, location, timeout, anchorScroll);
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
                'level': 3,
                'name': 'Name1',
                'id': 'Id1'
            };

            spyOn(orgUnitService, 'create').and.returnValue(utils.getPromise(q, orgUnitId));
            spyOn(location, 'hash');

            scope.save(newOrgUnit, parent);
            scope.$apply();

            var expectedNewOrgUnit = [{
                id: orgUnitId,
                name: newOrgUnit.name,
                shortName: newOrgUnit.name,
                openingDate: moment(newOrgUnit.openingDate).format("YYYY-MM-DD"),
                level: 4,
                parent: {
                    id: parent.id,
                    name: parent.name,
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "prjConDays",
                        "name": "No of Consultation days per week",
                        "id": "VKc7bvogtcP"
                    },
                    "value": newOrgUnit.consultDays
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

            expect(location.hash).toHaveBeenCalledWith([orgUnitId]);
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
                "attributeValues": [{
                    "attribute": {
                        "code": "prjConDays",
                        "name": "No of Consultation days per week",
                        "id": "VKc7bvogtcP"
                    },
                    "value": "val1"
                }, {
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
                'consultDays': "val1",
                'context': "val2",
                'location': "val3",
                'projectType': "val4",
                'endDate': moment("2011-01-01").toDate(),
                'populationType': "val6",
            };

            scope.isEditMode = false;
            scope.$apply();

            projectController = new ProjectController(scope, db, orgUnitService, q, location, timeout, anchorScroll);

            expect(scope.newOrgUnit).toEqual(expectedNewOrgUnit);
        });

    });

});