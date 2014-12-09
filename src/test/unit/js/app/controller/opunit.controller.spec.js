/*global Date:true*/
define(["opUnitController", "angularMocks", "utils", "orgUnitGroupHelper"], function(OpUnitController, mocks, utils, OrgUnitGroupHelper) {
    describe("op unit controller", function() {

        var scope, opUnitController, db, q, location, _Date, hustle, orgUnitRepo, fakeModal, orgUnitGroupHelper;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
            scope = $rootScope.$new();
            scope.isNewMode = true;
            q = $q;
            hustle = $hustle;
            location = $location;

            orgUnitRepo = utils.getMockRepo(q);
            orgUnitGroupHelper = new OrgUnitGroupHelper();
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
            opUnitController = new OpUnitController(scope, q, hustle, orgUnitRepo, orgUnitGroupHelper, db, location, fakeModal);
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
                        code: 'opUnitType'
                    },
                    value: 'Hospital'
                }, {
                    attribute: {
                        code: 'Type'
                    },
                    value: 'Operation Unit'
                }, {
                    attribute: {
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
                        code: 'opUnitType'
                    },
                    value: 'Community'
                }, {
                    attribute: {
                        code: 'Type'
                    },
                    value: 'Operation Unit'
                }, {
                    attribute: {
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

        it('should update operation units', function() {
            var opUnit1 = {
                'name': 'OpUnit1',
                'type': 'Hospital',
                'openingDate': today,
                'hospitalUnitCode': 'Unit Code - A'
            };
            var opUnits = [opUnit1];

            scope.orgUnit = {
                'id': "opUnit1Id",
                'name': 'OpUnit1',
                'type': 'Health Center',
                'level': 5,
                'hospitalUnitCode': 'Unit Code - B1',
                'parent': {
                    'name': 'Parent',
                    'id': 'ParentId'
                }
            };

            var expectedOpUnits = [{
                name: 'OpUnit1',
                id: 'opUnit1Id',
                openingDate: today,
                shortName: 'OpUnit1',
                level: 5,
                parent: {
                    name: 'Parent',
                    id: 'ParentId'
                },
                attributeValues: [{
                    attribute: {
                        code: 'opUnitType'
                    },
                    value: 'Hospital'
                }, {
                    attribute: {
                        code: 'Type'
                    },
                    value: 'Operation Unit'
                }, {
                    attribute: {
                        code: 'hospitalUnitCode'
                    },
                    value: 'Unit Code - A'
                }]
            }];

            spyOn(location, 'hash');

            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitGroupHelper, "createOrgUnitGroups");

            scope.update(opUnits);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOpUnits);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedOpUnits,
                type: "upsertOrgUnit"
            }, "dataValues");
            expect(orgUnitRepo.getAllModulesInOpUnit).toHaveBeenCalledWith("opUnit1Id");
            expect(orgUnitGroupHelper.createOrgUnitGroups).toHaveBeenCalled();
        });
    });
});