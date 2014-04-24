define(["countryController", "angularMocks", "utils", "moment"], function(CountryController, mocks, utils, moment) {

    describe("countryControllerspec", function() {

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
                create: function() {}
            };

            anchorScroll = jasmine.createSpy();
            scope.isEditMode = true;
            countryController = new CountryController(scope, orgUnitService, db, q, location, timeout, anchorScroll);
        }));

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

        it("should save country in dhis", function() {
            var orgUnitId = 'a4acf9115a7';

            var newOrgUnit = {
                'name': 'Org1',
                'openingDate': moment().toDate(),
            };

            var parent = {
                'level': 2,
                'name': 'Name1',
                'id': 'Id1'
            };

            spyOn(orgUnitService, 'create').and.returnValue(utils.getPromise(q, {}));
            spyOn(mockOrgStore, 'upsert').and.returnValue(utils.getPromise(q, orgUnitId));
            spyOn(location, 'hash');

            scope.save(newOrgUnit, parent);
            scope.$apply();

            var expectedNewOrgUnit = [{
                id: orgUnitId,
                name: newOrgUnit.name,
                openingDate: moment(newOrgUnit.openingDate).format("YYYY-MM-DD"),
                shortName: newOrgUnit.name,
                level: 3,
                parent: {
                    id: parent.id,
                    name: parent.name,
                }
            }];

            expect(orgUnitService.create).toHaveBeenCalledWith(expectedNewOrgUnit);
            expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedNewOrgUnit);
            expect(location.hash).toHaveBeenCalledWith(orgUnitId);
        });

        it("should display error if saving organization unit fails", function() {
            var newOrgUnit = {};

            spyOn(orgUnitService, 'create').and.returnValue(utils.getRejectedPromise(q, {}));

            scope.save(newOrgUnit, parent);
            scope.$apply();

            expect(scope.saveFailure).toEqual(true);
        });

        it("should show project details when in view mode", function() {
            scope.newOrgUnit = {};
            scope.orgUnit = {
                "name": "anyname",
                "openingDate": "YYYY-MM-DD",
            };
            var expectedNewOrgUnit = {
                'name': scope.orgUnit.name,
                'openingDate': scope.orgUnit.openingDate,
            };

            scope.isEditMode = false;
            scope.$apply();

            countryController = new CountryController(scope, orgUnitService, db, q, location, timeout, anchorScroll);

            expect(scope.newOrgUnit).toEqual(expectedNewOrgUnit);
        });

    });
});