define(["projectController", "angularMocks", "utils", "lodash", "moment"], function(ProjectController, mocks, utils, _, moment) {

    describe("project controller tests", function() {

        var scope, timeout, q, location, db, mockOrgStore, projectsService, anchorScroll;

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

            projectsService = {
                "create": function() {}
            };

            anchorScroll = jasmine.createSpy();
            scope.isEditMode = true;
            projectController = new ProjectController(scope, db, projectsService, q, location, timeout, anchorScroll);
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

            spyOn(projectsService, 'create').and.returnValue(utils.getPromise(q, {}));
            spyOn(mockOrgStore, 'upsert').and.returnValue(utils.getPromise(q, orgUnitId));
            spyOn(location, 'hash');

            scope.save(newOrgUnit, parent);
            scope.$apply();

            var expectedNewOrgUnit = {
                id: orgUnitId,
                name: newOrgUnit.name,
                location: newOrgUnit.location,
                openingDate: moment(newOrgUnit.openingDate).format("YYYY-MM-DD"),
                endDate: moment(newOrgUnit.endDate).format("YYYY-MM-DD"),
                shortName: newOrgUnit.name,
                level: 4,
                parent: {
                    id: parent.id,
                    name: parent.name,
                }
            };

            expect(projectsService.create).toHaveBeenCalledWith([expectedNewOrgUnit]);
            expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedNewOrgUnit);
            expect(location.hash).toHaveBeenCalledWith(orgUnitId);
        });

        it("should display error if saving organization unit fails", function() {
            var newOrgUnit = {};

            spyOn(projectsService, 'create').and.returnValue(utils.getRejectedPromise(q, {}));

            scope.save(newOrgUnit, parent);
            scope.$apply();

            expect(scope.saveFailure).toEqual(true);
        });

        it("should reset form", function() {
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
            expect(scope.endDate).toBe(true);
        });

    });

});