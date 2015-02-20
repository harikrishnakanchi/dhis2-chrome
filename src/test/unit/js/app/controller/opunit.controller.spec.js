/*global Date:true*/
define(["opUnitController", "angularMocks", "utils", "orgUnitGroupHelper", "timecop", "moment","dhisId"], function(OpUnitController, mocks, utils, OrgUnitGroupHelper, timecop, moment,dhisId) {
    describe("op unit controller", function() {

        var scope, opUnitController, db, q, location, _Date, hustle, orgUnitRepo, fakeModal, orgUnitGroupHelper;

        beforeEach(module("hustle"));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
            scope = $rootScope.$new();
            scope.isNewMode = true;
            q = $q;
            hustle = $hustle;
            location = $location;

            orgUnitRepo = utils.getMockRepo(q);
            orgUnitGroupHelper = new OrgUnitGroupHelper();
            scope.orgUnit = {
                "id": "blah",
                "parent": {
                    "id": "parent"
                }
            };

            Timecop.install();
            Timecop.freeze(new Date("2014-10-29T12:43:54.972Z"));

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
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should add new op units", function() {
            scope.isNewMode = false;

            scope.$apply();
            var orginalOpUnitLen = scope.opUnits.length;
            scope.addOpUnits();

            expect(scope.opUnits.length).toBe(orginalOpUnitLen + 1);
            expect(scope.isDisabled).toBeFalsy();
        });

        it("should delete operation unit", function() {
            scope.opUnits = [{
                "name": "opUnit1"
            }, {
                "name": "opUnit2"
            }, {
                "name": "opUnit1"
            }, {
                "name": "opUnit4"
            }];

            scope.isNewMode = false;
            scope.$apply();

            scope.delete(2);
            expect(scope.opUnits).toEqual([{
                "name": "opUnit1"
            }, {
                "name": "opUnit2"
            }, {
                "name": "opUnit4"
            }]);
        });

        it("should save operation units", function() {
            var opUnit1Id = "a823e522c15";
            var opUnit2Id = "a764a0f84af";
            var opUnit1 = {
                "name": "OpUnit1",
                "type": "Hospital",
                "openingDate": moment().format("YYYY-MM-DD"),
                "hospitalUnitCode": "Unit Code - A"
            };
            var opUnit2 = {
                "name": "OpUnit2",
                "type": "Community",
                "openingDate": moment().format("YYYY-MM-DD"),
                "hospitalUnitCode": "Unit Code - A"
            };
            var opUnits = [opUnit1, opUnit2];

            scope.orgUnit = {
                "level": "4",
                "name": "Parent",
                "id": "ParentId",
                "children": []
            };

            var expectedOpUnits = [{
                "name": "OpUnit1",
                "openingDate": moment().format("YYYY-MM-DD"),
                "id": "OpUnit1ParentId",
                "shortName": "OpUnit1",
                "level": 5,
                "parent": {
                    "name": "Parent",
                    "id": "ParentId"
                },
                "attributeValues": [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "opUnitType"
                    },
                    "value": "Hospital"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Operation Unit"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "hospitalUnitCode"
                    },
                    "value": "Unit Code - A"
                }]
            }, {
                "name": "OpUnit2",
                "openingDate": moment().format("YYYY-MM-DD"),
                "id": "OpUnit2ParentId",
                "shortName": "OpUnit2",
                "level": 5,
                "parent": {
                    "name": "Parent",
                    "id": "ParentId"
                },
                "attributeValues": [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "opUnitType"
                    },
                    "value": "Community"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Operation Unit"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "hospitalUnitCode"
                    },
                    "value": "Unit Code - A"
                }]
            }];

            spyOn(location, "hash");
            spyOn(dhisId, "get").and.callFake(function(name){
                return name;
            });
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {"data":{"data":[]}}));

            scope.save(opUnits);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOpUnits);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": expectedOpUnits,
                "type": "upsertOrgUnit"
            }, "dataValues");
        });

        it("should set operation unit for view", function() {
            scope.orgUnit = {
                "name": "opUnit1",
                "parent": {
                    "id": "parent"
                },
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

            opUnitController = new OpUnitController(scope, q, hustle, orgUnitRepo, db, location, fakeModal);

            scope.$apply();
            expect(scope.opUnits[0].name).toEqual("opUnit1");
            expect(scope.opUnits[0].type).toEqual("Health Center");
            expect(scope.isDisabled).toBeFalsy();
        });

        it("should disable disable button for opunit", function() {
            scope.orgUnit = {
                "name": "opUnit1",
                "parent": {
                    "id": "parent"
                },
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

            opUnitController = new OpUnitController(scope, q, hustle, orgUnitRepo, db, location, fakeModal);

            scope.$apply();
            expect(scope.isDisabled).toBeTruthy();
        });

        it("should disable opunit and all its modules", function() {
            scope.$parent.closeNewForm = jasmine.createSpy();
            scope.resourceBundle = {};
            var opunit = {
                "name": "opunit1",
                "id": "opunit1",
                "datasets": [],
                "attributeValues": []
            };

            var module = {
                "name": "mod1",
                "id": "mod1",
                "attributeValues": [],
                "parent": {
                    "id": "opunit1",
                }
            };

            var modulesUnderOpunit = [module];

            var expectedOrgUnits = [{
                "name": "mod1",
                "id": "mod1",
                "attributeValues": [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "isDisabled",
                        "name": "Is Disabled"
                    },
                    "value": true
                }],
                "parent": {
                    "id": "opunit1",
                }
            }, {
                "name": "opunit1",
                "id": "opunit1",
                "datasets": [],
                "attributeValues": [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "isDisabled",
                        "name": "Is Disabled"
                    },
                    "value": true
                }]
            }];
            var expectedHustleMessage = {
                "data": expectedOrgUnits,
                "type": "upsertOrgUnit"
            };
            orgUnitRepo.getAllModulesInOrgUnits = jasmine.createSpy("getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, modulesUnderOpunit));
            spyOn(hustle, "publish");
            spyOn(fakeModal, "open").and.returnValue({
                result: utils.getPromise(q, {})
            });

            scope.disable(opunit);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOrgUnits);
            expect(hustle.publish).toHaveBeenCalledWith(expectedHustleMessage, "dataValues");
            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(opunit, "disabledOpUnit");
            expect(scope.isDisabled).toEqual(true);
        });

        it("should update operation units", function() {
            var opUnit1 = {
                "name": "OpUnit1",
                "type": "Hospital",
                "openingDate": moment().format("YYYY-MM-DD"),
                "hospitalUnitCode": "Unit Code - A"
            };
            var opUnits = [opUnit1];

            scope.orgUnit = {
                "id": "opUnit1Id",
                "name": "OpUnit1",
                "type": "Health Center",
                "level": 5,
                "hospitalUnitCode": "Unit Code - B1",
                "parent": {
                    "name": "Parent",
                    "id": "ParentId"
                },
                "children": []
            };

            var expectedOpUnits = [{
                "name": "OpUnit1",
                "id": "opUnit1Id",
                "openingDate": moment().format("YYYY-MM-DD"),
                "shortName": "OpUnit1",
                "level": 5,
                "parent": {
                    "name": "Parent",
                    "id": "ParentId"
                },
                "children": [],
                "attributeValues": [{
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "opUnitType"
                    },
                    "value": "Hospital"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Operation Unit"
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": "hospitalUnitCode"
                    },
                    "value": "Unit Code - A"
                }]
            }];

            spyOn(location, "hash");

            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {"data":{"data":[]}}));
            spyOn(orgUnitGroupHelper, "createOrgUnitGroups");

            scope.update(opUnits);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOpUnits);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": expectedOpUnits,
                "type": "upsertOrgUnit"
            }, "dataValues");
            expect(orgUnitGroupHelper.createOrgUnitGroups).toHaveBeenCalled();
        });
    });
});
