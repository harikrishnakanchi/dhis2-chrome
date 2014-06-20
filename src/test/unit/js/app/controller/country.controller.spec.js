define(["countryController", "angularMocks", "utils", "moment"], function(CountryController, mocks, utils, moment) {

    describe("contry controller", function() {

        var scope, timeout, q, location, orgUnitService, anchorScroll;

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
            countryController = new CountryController(scope, orgUnitService, q, location, timeout, anchorScroll);
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
            var orgUnitId = '1ef081fea77';

            var newOrgUnit = {
                'name': 'Org1',
                'openingDate': moment().toDate(),
            };

            var parent = {
                'name': 'Name1',
                'id': 'Id1',
                'level': '2',
            };

            spyOn(orgUnitService, 'create').and.returnValue(utils.getPromise(q, {}));

            scope.save(newOrgUnit, parent);
            scope.$apply();

            var expectedNewOrgUnit = [{
                'id': orgUnitId,
                'name': newOrgUnit.name,
                'level': 3,
                'openingDate': moment(newOrgUnit.openingDate).format("YYYY-MM-DD"),
                'shortName': newOrgUnit.name,
                'parent': {
                    'id': parent.id,
                    'name': parent.name,
                },
                'attributeValues': [{
                    'attribute': {
                        'id': "a1fa2777924"
                    },
                    'value': "Country"
                }]
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

            countryController = new CountryController(scope, orgUnitService, q, location, timeout, anchorScroll);

            expect(scope.newOrgUnit).toEqual(expectedNewOrgUnit);
        });

    });
});