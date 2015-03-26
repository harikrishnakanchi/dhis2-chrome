/*global Date:true*/
define(["opUnitController", "angularMocks", "utils", "orgUnitGroupHelper", "timecop", "moment", "dhisId"], function(OpUnitController, mocks, utils, OrgUnitGroupHelper, timecop, moment, dhisId) {
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

        it("should save operation unit", function() {
            var opUnit = {
                "name": "OpUnit1",
                "type": "Hospital",
                "openingDate": moment().format("YYYY-MM-DD"),
                "hospitalUnitCode": "Unit Code - A"
            };

            scope.orgUnit = {
                "level": "4",
                "name": "Parent",
                "id": "ParentId",
                "children": []
            };

            var expectedOpUnit = {
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
            };

            spyOn(location, "hash");
            spyOn(dhisId, "get").and.callFake(function(name) {
                return name;
            });
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {
                "data": {
                    "data": []
                }
            }));

            scope.save(opUnit);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": expectedOpUnit,
                "type": "upsertOrgUnit"
            }, "dataValues");
        });

        it("should not hospital unit code while saving operation unit if it is not hospital", function() {
            var opUnit = {
                "name": "OpUnit1",
                "type": "Health Center",
                "openingDate": moment().format("YYYY-MM-DD"),
                "hospitalUnitCode": "Unit Code - A"
            };

            scope.orgUnit = {
                "level": "4",
                "name": "Parent",
                "id": "ParentId",
                "children": []
            };

            var expectedOpUnit = {
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
                    "value": "Health Center"
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
                    "value": ""
                }]
            };

            spyOn(location, "hash");
            spyOn(dhisId, "get").and.callFake(function(name) {
                return name;
            });
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {
                "data": {
                    "data": []
                }
            }));

            scope.save(opUnit);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": expectedOpUnit,
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
            expect(scope.opUnit.name).toEqual("opUnit1");
            expect(scope.opUnit.type).toEqual("Health Center");
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
                    "value": "true"
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
                    "value": "true"
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
                    "value": "true"
                }]
            }];
            var expectedHustleMessage = {
                "data": expectedOrgUnits,
                "type": "upsertOrgUnit"
            };
            orgUnitRepo.getAllModulesInOrgUnitsExceptCurrentModules = jasmine.createSpy("getAllModulesInOrgUnitsExceptCurrentModules").and.returnValue(utils.getPromise(q, modulesUnderOpunit));
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

        it("should update operation unit", function() {
            var opUnit = {
                "name": "OpUnit1",
                "type": "Hospital",
                "openingDate": moment().format("YYYY-MM-DD"),
                "hospitalUnitCode": "Unit Code - A"
            };

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

            var expectedOpUnit = {
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
            };

            spyOn(location, "hash");

            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {
                "data": {
                    "data": []
                }
            }));
            spyOn(orgUnitGroupHelper, "createOrgUnitGroups");

            scope.update(opUnit);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": expectedOpUnit,
                "type": "upsertOrgUnit"
            }, "dataValues");
            expect(orgUnitGroupHelper.createOrgUnitGroups).toHaveBeenCalled();
        });

        it("should take the user to the view page of the parent project on clicking cancel", function() {
            scope.orgUnit = {
                "id": "parent",
                "name": "parent"
            };

            scope.$parent = {
                "closeNewForm": function() {}
            };

            spyOn(scope.$parent, "closeNewForm").and.callFake(function(parentOrgUnit) {
                return;
            });

            scope.closeForm();

            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(scope.orgUnit);
        });
    });
});
