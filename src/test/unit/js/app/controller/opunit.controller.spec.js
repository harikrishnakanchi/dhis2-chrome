/*global Date:true*/
define(["opUnitController", "angularMocks", "utils"], function(OpUnitController, mocks, utils) {
    describe("op unit controller", function() {

        var scope, opUnitController, mockOrgStore, db, q, location, _Date, hustle, orgUnitRepo;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
            scope = $rootScope.$new();
            scope.isEditMode = true;
            q = $q;
            hustle = $hustle;
            location = $location;

            orgUnitRepo = utils.getMockRepo(q);
            mockOrgStore = {
                upsert: function() {}
            };
            db = {
                objectStore: function(store) {
                    return mockOrgStore;
                }
            };

            scope.orgUnit = {
                id: "blah"
            };

            _Date = Date;
            todayStr = "2014-04-01";
            today = new Date(todayStr);
            Date = function() {
                return today;
            };

            opUnitController = new OpUnitController(scope, hustle, orgUnitRepo, db, location);
        }));

        afterEach(function() {
            Date = _Date;
        });

        it('should add new op units', function() {
            scope.isEditMode = false;
            scope.$apply();
            var orginalOpUnitLen = scope.opUnits.length;
            scope.addOpUnits();
            expect(scope.opUnits.length).toBe(orginalOpUnitLen + 1);
        });

        it('should delete operation unit', function() {
            scope.opUnits = [{
                'name': 'opUnit1'
            }, {
                'name': 'opUnit2'
            }, {
                'name': 'opUnit1'
            }, {
                'name': 'opUnit4'
            }];

            scope.isEditMode = false;
            scope.$apply();

            scope.delete(2);
            expect(scope.opUnits).toEqual([{
                'name': 'opUnit1'
            }, {
                'name': 'opUnit2'
            }, {
                'name': 'opUnit4'
            }]);

        });

        it('should save operation units', function() {
            var opUnit1Id = '133e9670f74';
            var opUnit2Id = 'e9f172906f6';
            var opUnit1 = {
                'name': 'OpUnit1',
                'type': 'Hospital',
                'openingDate': today
            };
            var opUnit2 = {
                'name': 'OpUnit2',
                'type': 'Community',
                'openingDate': today
            };
            var opUnits = [opUnit1, opUnit2];

            scope.orgUnit = {
                'level': '4',
                'name': 'Parent',
                'id': 'ParentId'
            };

            var expectedOpUnits = [{
                id: opUnit1Id,
                name: opUnit1.name,
                shortName: opUnit1.name,
                openingDate: today,
                level: 5,
                parent: {
                    id: scope.orgUnit.id,
                    name: scope.orgUnit.name
                },
                attributeValues: [{
                    attribute: {
                        id: "52ec8ccaf8f"
                    },
                    value: opUnit1.type
                }, {
                    "attribute": {
                        "id": "a1fa2777924"
                    },
                    "value": "Operation Unit"
                }]
            }, {
                id: opUnit2Id,
                name: opUnit2.name,
                shortName: opUnit2.name,
                openingDate: today,
                level: 5,
                parent: {
                    id: scope.orgUnit.id,
                    name: scope.orgUnit.name
                },
                attributeValues: [{
                    attribute: {
                        id: "52ec8ccaf8f"
                    },
                    value: opUnit2.type
                }, {
                    "attribute": {
                        "id": "a1fa2777924"
                    },
                    "value": "Operation Unit"
                }]
            }];

            spyOn(location, 'hash');

            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            scope.save(opUnits);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOpUnits);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedOpUnits,
                type: "createOrgUnit"
            }, "dataValues");
        });

        it("should set operation unit for view", function() {
            scope.orgUnit = {
                'name': 'opUnit1',
                "attributeValues": [{
                    "attribute": {
                        "id": "52ec8ccaf8f"
                    },
                    "value": "Health Center"
                }, {
                    "attribute": {
                        "id": "a1fa2777924"
                    },
                    "value": "Operation Unit"
                }]
            };
            scope.isEditMode = false;

            opUnitController = new OpUnitController(scope, hustle, orgUnitRepo, db, location);

            scope.$apply();
            expect(scope.opUnits[0].name).toEqual('opUnit1');
            expect(scope.opUnits[0].type).toEqual('Health Center');
        });
    });
});