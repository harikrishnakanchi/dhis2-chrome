/*global Date:true*/
define(["opUnitController", "angularMocks", "utils"], function(OpUnitController, mocks, utils) {
    describe("op unit controller", function() {

        var scope, opUnitController, db, q, location, _Date, hustle, orgUnitRepo, fakeModal;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
            scope = $rootScope.$new();
            scope.isNewMode = true;
            q = $q;
            hustle = $hustle;
            location = $location;

            orgUnitRepo = utils.getMockRepo(q);
            scope.orgUnit = {
                id: "blah"
            };

            _Date = Date;
            todayStr = "2014-04-01";
            today = new Date(todayStr);
            Date = function() {
                return today;
            };
            fakeModal = {
                close: function() {
                    this.result.confirmCallBack();
                },
                dismiss: function(type) {
                    this.result.cancelCallback(type);
                },
                open: function(object) {}
            };
            opUnitController = new OpUnitController(scope, q, hustle, orgUnitRepo, db, location, fakeModal);
        }));

        afterEach(function() {
            Date = _Date;
        });

        it('should add new op units', function() {
            scope.isNewMode = false;

            scope.$apply();
            var orginalOpUnitLen = scope.opUnits.length;
            scope.addOpUnits();

            expect(scope.opUnits.length).toBe(orginalOpUnitLen + 1);
            expect(scope.isDisabled).toBeFalsy();
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

            scope.isNewMode = false;
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
            var opUnit1Id = 'a823e522c15';
            var opUnit2Id = 'a764a0f84af';
            var opUnit1 = {
                'name': 'OpUnit1',
                'type': 'Hospital',
                'openingDate': today,
                'hospitalUnitCode': 'Unit Code - A'
            };
            var opUnit2 = {
                'name': 'OpUnit2',
                'type': 'Community',
                'openingDate': today,
                'hospitalUnitCode': 'Unit Code - A'
            };
            var opUnits = [opUnit1, opUnit2];

            scope.orgUnit = {
                'level': '4',
                'name': 'Parent',
                'id': 'ParentId',
                'children': []
            };

            var expectedOpUnits = [{
                name: 'OpUnit1',
                openingDate: today,
                id: 'a823e522c15',
                shortName: 'OpUnit1',
                level: 5,
                parent: {
                    name: 'Parent',
                    id: 'ParentId'
                },
                attributeValues: [{
                    attribute: {
                        id: '52ec8ccaf8f',
                        code: 'opUnitType'
                    },
                    value: 'Hospital'
                }, {
                    attribute: {
                        id: 'a1fa2777924',
                        code: 'Type'
                    },
                    value: 'Operation Unit'
                }, {
                    attribute: {
                        id: 'c6d3c8a7286',
                        code: 'hospitalUnitCode'
                    },
                    value: 'Unit Code - A'
                }]
            }, {
                name: 'OpUnit2',
                openingDate: today,
                id: 'a764a0f84af',
                shortName: 'OpUnit2',
                level: 5,
                parent: {
                    name: 'Parent',
                    id: 'ParentId'
                },
                attributeValues: [{
                    attribute: {
                        id: '52ec8ccaf8f',
                        code: 'opUnitType'
                    },
                    value: 'Community'
                }, {
                    attribute: {
                        id: 'a1fa2777924',
                        code: 'Type'
                    },
                    value: 'Operation Unit'
                }, {
                    attribute: {
                        id: 'c6d3c8a7286',
                        code: 'hospitalUnitCode'
                    },
                    value: 'Unit Code - A'
                }]
            }];

            spyOn(location, 'hash');

            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            scope.save(opUnits);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOpUnits);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedOpUnits,
                type: "upsertOrgUnit"
            }, "dataValues");
        });

        it("should set operation unit for view", function() {
            scope.orgUnit = {
                'name': 'opUnit1',
                "attributeValues": [{
                    "attribute": {
                        "code": "opUnitType"
                    },
                    "value": "Health Center"
                }, {
                    "attribute": {
                        "id": "a1fa2777924"
                    },
                    "value": "Operation Unit"
                }, {
                    "attribute": {
                        "code": "hospitalUnitCode"
                    },
                    "value": "Unit Code - B1"
                }]
            };
            scope.isNewMode = false;

            opUnitController = new OpUnitController(scope, hustle, orgUnitRepo, db, location, fakeModal);

            scope.$apply();
            expect(scope.opUnits[0].name).toEqual('opUnit1');
            expect(scope.opUnits[0].type).toEqual('Health Center');
            expect(scope.isDisabled).toBeFalsy();
        });

        it("should disable disable button for opunit", function() {
            scope.orgUnit = {
                'name': 'opUnit1',
                "attributeValues": [{
                    "attribute": {
                        "code": "opUnitType"
                    },
                    "value": "Health Center"
                }, {
                    "attribute": {
                        "code": "isDisabled"
                    },
                    "value": true
                }, {
                    "attribute": {
                        "code": "hospitalUnitCode"
                    },
                    "value": "Unit Code - B1"
                }]
            };
            scope.isNewMode = false;

            opUnitController = new OpUnitController(scope, hustle, orgUnitRepo, db, location, fakeModal);

            scope.$apply();
            expect(scope.isDisabled).toBeTruthy();
        });

        it("should disable opunit and all its modules", function() {
            scope.$parent.closeNewForm = jasmine.createSpy();
            scope.resourceBundle = {};
            var opunit = {
                name: "opunit1",
                id: "opunit1",
                datasets: [],
                attributeValues: []
            };

            var module = {
                name: "mod1",
                id: "mod1",
                attributeValues: [],
                parent: {
                    id: "opunit1",
                }
            };

            var modulesUnderOpunit = [module];

            var expectedOrgUnits = [{
                name: "mod1",
                id: "mod1",
                attributeValues: [{
                    attribute: {
                        code: 'isDisabled',
                        name: 'Is Disabled'
                    },
                    value: true
                }],
                parent: {
                    id: "opunit1",
                }
            }, {
                name: "opunit1",
                id: "opunit1",
                datasets: [],
                attributeValues: [{
                    attribute: {
                        code: 'isDisabled',
                        name: 'Is Disabled'
                    },
                    value: true
                }]
            }];
            var expectedHustleMessage = {
                data: expectedOrgUnits,
                type: "upsertOrgUnit"
            };
            orgUnitRepo.getAllModulesInProjects = jasmine.createSpy("getAllModulesInProjects").and.returnValue(utils.getPromise(q, modulesUnderOpunit));
            spyOn(hustle, "publish");
            spyOn(fakeModal, "open").and.returnValue({
                result: utils.getPromise(q, {})
            });

            scope.disable(opunit);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOrgUnits);
            expect(hustle.publish).toHaveBeenCalledWith(expectedHustleMessage, 'dataValues');
            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(opunit, 'disabledOpUnit');
            expect(scope.isDisabled).toEqual(true);
        });
    });
});