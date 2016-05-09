define(["countryController", "angularMocks", "utils", "moment", "timecop", "dhisId"], function(CountryController, mocks, utils, moment, timecop, dhisId) {

    describe("contry controller", function() {

        var scope, timeout, q, location, anchorScroll, hustle, orgUnitRepo, DhisId;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $hustle, $q, $timeout, $location) {
            scope = $rootScope.$new();
            q = $q;
            hustle = $hustle;
            timeout = $timeout;
            location = $location;

            orgUnitMapper = {
                getChildOrgUnitNames: function() {}
            };

            orgUnitRepo = utils.getMockRepo(q);
            orgUnitRepo.getAllModulesInOrgUnits = jasmine.createSpy("getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));
            orgUnitRepo.getChildOrgUnitNames = jasmine.createSpy("getChildOrgUnitNames").and.returnValue(utils.getPromise(q, []));

            scope.isNewMode = true;
            scope.orgUnit = {
                id: "blah"
            };

            scope.locale = "en";

            scope.resourceBundle = {
                "upsertOrgUnitDesc": "create organisation unit: ",
            };

            Timecop.install();
            Timecop.freeze(new Date('2014-10-29T12:43:54.972Z'));

            anchorScroll = jasmine.createSpy();
            countryController = new CountryController(scope, hustle, orgUnitRepo, q, location, timeout, anchorScroll);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
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

        it("should save country in dhis", function() {
            var orgUnitId = 'Org1Id1';

            var newOrgUnit = {
                'name': 'Org1',
                'openingDate': moment().toDate(),
            };

            var parent = {
                'name': 'Name1',
                'id': 'Id1',
                'level': '2',
                'children': []
            };

            var expectedNewOrgUnit = {
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
                    'created': '2014-10-29T12:43:54.972Z',
                    'lastUpdated': '2014-10-29T12:43:54.972Z',
                    'attribute': {
                        'code': 'Type',
                        'name': 'Type'
                    },
                    'value': "Country"
                }, {
                    'created': '2014-10-29T12:43:54.972Z',
                    'lastUpdated': '2014-10-29T12:43:54.972Z',
                    'attribute': {
                        'code': 'isNewDataModel',
                        'name': 'Is New Data Model'
                    },
                    'value': 'true'
                }]
            };

            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            spyOn(dhisId, "get").and.callFake(function(name) {
                return name;
            });

            scope.save(newOrgUnit, parent);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith([expectedNewOrgUnit]);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": [expectedNewOrgUnit],
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "create organisation unit: Org1"
            }, 'dataValues');
        });

        it("should display error if saving organization unit fails", function() {
            var newOrgUnit = {};
            var parent = {
                'name': 'Name1',
                'id': 'Id1',
                'level': '2',
                'children': []
            };

            scope.save(newOrgUnit, parent);
            scope.$apply();

            expect(scope.saveFailure).toEqual(true);
        });

        it("should show project details when in view mode", function() {
            scope.newOrgUnit = {};
            scope.orgUnit = {
                "name": "anyname",
                "openingDate": new Date("2014-05-05"),
            };

            var expectedNewOrgUnit = {
                'name': scope.orgUnit.name,
                'openingDate': scope.orgUnit.openingDate,
            };

            scope.isNewMode = false;
            scope.$apply();

            countryController = new CountryController(scope, hustle, orgUnitRepo, q, location, timeout, anchorScroll);

            expect(scope.newOrgUnit).toEqual(expectedNewOrgUnit);
        });

        it("should take the user to the view page of OCP on clicking cancel", function() {
            var parentOrgUnit = {
                'id': 'parent',
                'name': 'parent'
            };

            scope.$parent = {
                "closeNewForm": function() {}
            };

            spyOn(scope.$parent, "closeNewForm").and.callFake(function(parentOrgUnit) {
                return;
            });

            countryController = new CountryController(scope, hustle, orgUnitRepo, q, location, timeout, anchorScroll);

            scope.closeForm(parentOrgUnit);

            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(parentOrgUnit);
        });

    });
});
