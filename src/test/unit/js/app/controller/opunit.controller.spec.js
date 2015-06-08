/*global Date:true*/
define(["opUnitController", "angularMocks", "utils", "orgUnitGroupHelper", "timecop", "moment", "dhisId", "orgUnitRepository", "patientOriginRepository", "orgUnitGroupSetRepository"], function(OpUnitController, mocks, utils, OrgUnitGroupHelper, timecop, moment, dhisId, OrgUnitRepository, PatientOriginRepository, OrgUnitGroupSetRepository) {
    describe("op unit controller", function() {

        var scope, opUnitController, db, q, location, _Date, hustle, orgUnitRepo, fakeModal, orgUnitGroupHelper, patientOriginRepository, orgUnitRepository, orgUnitGroupSets, orgUnitGroupSetRepository;

        beforeEach(module("hustle"));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
            scope = $rootScope.$new();
            scope.isNewMode = true;
            q = $q;
            hustle = $hustle;
            location = $location;

            orgUnitRepository = new OrgUnitRepository();
            orgUnitGroupSetRepository = new OrgUnitGroupSetRepository();

            spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));
            spyOn(orgUnitRepository, "getChildOrgUnitNames").and.returnValue(utils.getPromise(q, []));
            spyOn(orgUnitRepository, "upsert").and.callFake(function(orgUnits) {
                return utils.getPromise(q, [orgUnits]);
            });
            spyOn(orgUnitRepository, "getAllOriginsByName").and.returnValue(utils.getPromise(q, {}));

            orgUnitGroupHelper = new OrgUnitGroupHelper();
            scope.orgUnit = {
                "id": "blah",
                "parent": {
                    "id": "parent"
                }
            };

            patientOriginRepository = new PatientOriginRepository();
            spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, {}));
            spyOn(patientOriginRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

            scope.currentUser = {
                "locale": "en"
            };

            scope.resourceBundle = {
                "uploadPatientOriginDetailsDesc": "create patient origin ",
                "upsertOrgUnitDesc": "upsert org unit "
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

            orgUnitGroupSets = [{
                "name": "Hospital Unit Code",
                "code": "hospital_unit_code",
                "id": "a9ca3d1ed93",
                "organisationUnitGroups": [{
                    "id": "a9ab62b5ef3",
                    "name": "Unit Code - C2"
                }, {
                    "id": "aedbab45572",
                    "name": "Unit Code - B1"
                }]
            }, {
                "name": "Model Of Management",
                "code": "model_of_management",
                "id": "a2d4a1dee27",
                "organisationUnitGroups": [{
                    "id": "a11a7a5d55a",
                    "name": "Collaboration"
                }]
            }];

            spyOn(orgUnitGroupSetRepository, "getAll").and.returnValue(utils.getPromise(q, orgUnitGroupSets));
            opUnitController = new OpUnitController(scope, q, hustle, orgUnitRepository, orgUnitGroupHelper, db, location, fakeModal, patientOriginRepository, orgUnitGroupSetRepository);
            scope.$apply();
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should save operation unit", function() {
            var opUnit = {
                "name": "OpUnit1",
                "type": {
                    "title": "Hospital"
                },
                "openingDate": moment().format("YYYY-MM-DD"),
                "hospitalUnitCode": {
                    "title": "Unit Code - A"
                }
            };

            scope.orgUnit = {
                "level": "4",
                "name": "Parent",
                "id": "ParentId"
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
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": 'isNewDataModel'
                    },
                    "value": 'true'
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

            expect(orgUnitRepository.upsert.calls.argsFor(0)[0]).toEqual(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": [expectedOpUnit],
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit OpUnit1"
            }, "dataValues");
        });

        it("should set hospitalUnitCodes on scope on init", function() {
            expect(scope.hospitalUnitCodes).toEqual([{
                "id": "aedbab45572",
                "name": "B1"
            }, {
                "id": "a9ab62b5ef3",
                "name": "C2"
            }]);
        });

        it("should save operation unit with GIS coordinate information", function() {
            var opUnit = {
                "name": "OpUnit1",
                "type": {
                    "title": "Hospital"
                },
                "openingDate": moment().format("YYYY-MM-DD"),
                "hospitalUnitCode": {
                    "title": "Unit Code - A"
                },
                "latitude": 50,
                "longitude": 25
            };

            scope.orgUnit = {
                "level": "4",
                "name": "Parent",
                "id": "ParentId"
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
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": 'isNewDataModel'
                    },
                    "value": 'true'
                }],
                "coordinates": "[25,50]",
                "featureType": "Point"
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

            expect(orgUnitRepository.upsert.calls.argsFor(0)[0]).toEqual(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": [expectedOpUnit],
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit OpUnit1"
            }, "dataValues");
        });

        it("should not ask for hospital unit code while saving operation unit if it is not hospital", function() {
            var opUnit = {
                "name": "OpUnit1",
                "type": {
                    "title": "Health Center"
                },
                "openingDate": moment().format("YYYY-MM-DD"),
                "hospitalUnitCode": {
                    "title": "Unit Code - A"
                }
            };

            scope.orgUnit = {
                "level": "4",
                "name": "Parent",
                "id": "ParentId"
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
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": 'isNewDataModel'
                    },
                    "value": 'true'
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

            expect(orgUnitRepository.upsert.calls.argsFor(0)[0]).toEqual(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": [expectedOpUnit],
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit OpUnit1"
            }, "dataValues");
        });

        it("should set operation unit for view and show patientOrigins", function() {
            scope.orgUnit = {
                "name": "opUnit1",
                "parent": {
                    "id": "parent"
                },
                "coordinates": "[29,-45]",
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

            var patientOrigins = {
                "orgUnit": "opunitid",
                "origins": [{
                    "originName": "test",
                    "latitude": 78,
                    "longitude": 80
                }, {
                    "originName": "Unknown"
                }]
            };

            var expectedPatientOrigins = {
                "orgUnit": "opunitid",
                "origins": [{
                    "originName": "test",
                    "latitude": 78,
                    "longitude": 80
                }]
            };

            scope.isNewMode = false;

            patientOriginRepository.get.and.returnValue(utils.getPromise(q, patientOrigins));

            opUnitController = new OpUnitController(scope, q, hustle, orgUnitRepository, orgUnitGroupHelper, db, location, fakeModal, patientOriginRepository, orgUnitGroupSetRepository);

            scope.$apply();
            expect(scope.opUnit.name).toEqual("opUnit1");
            expect(scope.opUnit.type.name).toEqual("Health Center");
            expect(scope.opUnit.longitude).toEqual(29);
            expect(scope.opUnit.latitude).toEqual(-45);
            expect(scope.isDisabled).toBeFalsy();
            expect(scope.originDetails).toEqual(expectedPatientOrigins.origins);
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

            opUnitController = new OpUnitController(scope, q, hustle, orgUnitRepository, orgUnitGroupHelper, db, location, fakeModal, patientOriginRepository, orgUnitGroupSetRepository);

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
                "attributeValues": [],
                "parent": {
                    "id": "parent"
                }
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
                }],
                "parent": {
                    "id": "parent"
                }
            }];
            var expectedHustleMessage = {
                "data": expectedOrgUnits,
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "undefinedmod1"
            };
            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modulesUnderOpunit));
            spyOn(hustle, "publish");
            spyOn(fakeModal, "open").and.returnValue({
                result: utils.getPromise(q, {})
            });

            scope.disable(opunit);
            scope.$apply();

            expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedOrgUnits);
            expect(hustle.publish).toHaveBeenCalledWith(expectedHustleMessage, "dataValues");
            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(opunit.parent, "disabledOpUnit");
            expect(scope.isDisabled).toEqual(true);
        });

        it("should update operation unit", function() {
            var opUnit = {
                "name": "OpUnit1",
                "type": {
                    "title": "Hospital"
                },
                "openingDate": moment().format("YYYY-MM-DD"),
                "hospitalUnitCode": {
                    "name": "Unit Code - A"
                }
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
                }
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
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": 'isNewDataModel'
                    },
                    "value": 'true'
                }]
            };

            var modulesUnderOpunit = [{
                "id": "aggMod1"
            }, {
                "id": "lineMod1",
                "attributeValues": [{
                    "attribute": {
                        "code": "isLineListService",
                    },
                    "value": "true"
                }]
            }];

            var originOrgUnits = [{
                "id": "child1",
                "name": "child1"
            }, {
                "id": "child2",
                "name": "child2"
            }];

            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modulesUnderOpunit));
            spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, originOrgUnits));
            spyOn(location, "hash");
            spyOn(hustle, "publish");
            spyOn(orgUnitGroupHelper, "createOrgUnitGroups").and.returnValue(utils.getPromise(q, {}));

            scope.update(opUnit);
            scope.$apply();

            expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": [expectedOpUnit],
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit OpUnit1"
            }, "dataValues");
            expect(orgUnitGroupHelper.createOrgUnitGroups).toHaveBeenCalled();
        });

        it("should update operation unit with GIS coordinates", function() {
            var opUnit = {
                "name": "OpUnit1",
                "type": {
                    "title": "Hospital"
                },
                "openingDate": moment().format("YYYY-MM-DD"),
                "hospitalUnitCode": {
                    "name": "Unit Code - A"
                },
                "latitude": 50,
                "longitude": 25
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
                }
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
                }, {
                    "created": "2014-10-29T12:43:54.972Z",
                    "lastUpdated": "2014-10-29T12:43:54.972Z",
                    "attribute": {
                        "code": 'isNewDataModel'
                    },
                    "value": 'true'
                }],
                "coordinates": "[25,50]",
                "featureType": "Point"
            };

            var orgunitsToAssociate = [{
                "id": "child1",
                "name": "child1"
            }, {
                "id": "child2",
                "name": "child2"
            }];

            spyOn(location, "hash");

            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {
                "data": {
                    "data": []
                }
            }));
            spyOn(orgUnitGroupHelper, "createOrgUnitGroups").and.returnValue(utils.getPromise(q, {}));

            scope.update(opUnit);
            scope.$apply();

            expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": [expectedOpUnit],
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit OpUnit1"
            }, "dataValues");
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

        it("should create unknown origin orgunit while creating an operational unit", function() {
            var opUnit = {
                "id": "OpUnit1",
                "name": "OpUnit1",
                "type": "Hospital",
                "openingDate": moment().format("YYYY-MM-DD"),
                "hospitalUnitCode": "Unit Code - A"
            };

            var payload = {
                "orgUnit": "OpUnit1ParentId",
                "origins": [{
                    "name": "Not Specified",
                    "id": "OpUnit1ParentIdNot Specified",
                    "isDisabled": false,
                    "clientLastUpdated": "2014-10-29T12:43:54.972Z"
                }]
            };

            scope.orgUnit = {
                "level": "4",
                "name": "Parent",
                "id": "ParentId"
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

            expect(patientOriginRepository.upsert).toHaveBeenCalledWith(payload);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": payload,
                "type": "uploadPatientOriginDetails",
                "locale": "en",
                "desc": "create patient origin Not Specified"
            }, "dataValues");
        });

        it("should update org unit groups when op unit is updated", function() {
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
                }
            };

            var modulesUnderOpunit = [{
                "id": "aggMod1"
            }, {
                "id": "lineMod1",
                "attributeValues": [{
                    "attribute": {
                        "code": "isLineListService",
                    },
                    "value": "true"
                }]
            }];

            var originOrgUnits = [{
                "id": "child1",
                "name": "child1"
            }, {
                "id": "child2",
                "name": "child2"
            }];

            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modulesUnderOpunit));
            spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, originOrgUnits));

            spyOn(orgUnitGroupHelper, "createOrgUnitGroups").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {
                "data": {
                    "data": []
                }
            }));

            scope.update(opUnit);
            scope.$apply();


            var expectedOrgunitsToAssociate = [{
                "id": "aggMod1"
            }, {
                "id": "child1",
                "name": "child1"
            }, {
                "id": "child2",
                "name": "child2"
            }];
            expect(orgUnitGroupHelper.createOrgUnitGroups).toHaveBeenCalledWith(expectedOrgunitsToAssociate, true);
        });

        it("should disable patient origin", function() {
            scope.orgUnit = {
                "id": "opUnit1Id",
                "name": "OpUnit1"
            };

            var originToEnableDisable = {
                "id": "0",
                "name": "origin1"
            };

            var patientOrigin = {
                "orgUnit": "opUnit1Id",
                "origins": [{
                    "id": "0",
                    "name": "origin1",
                    "isDisabled": false
                }]
            };

            var origins = [{
                "id": "o1",
                "name": "origin1",
                "attributeValues": [{
                    "attribute": {
                        "code": "isDisabled"
                    },
                    "value": "false"
                }]
            }, {
                "id": "o3",
                "name": "origin1",
                "attributeValues": [{
                    "attribute": {
                        "code": "isSomething"
                    },
                    "value": "false"
                }]
            }];

            var expectedOrgUnitUpsert = [{
                "id": "o1",
                "name": "origin1",
                "attributeValues": [{
                    "attribute": {
                        "code": "isDisabled"
                    },
                    "value": "true"
                }]
            }, {
                "id": "o3",
                "name": "origin1",
                "attributeValues": [{
                    "attribute": {
                        "code": "isSomething"
                    },
                    "value": "false"
                }, {
                    "attribute": {
                        "code": "isDisabled"
                    },
                    "value": "true"
                }]

            }];

            var expectedPatientOriginUpsert = {
                "orgUnit": "opUnit1Id",
                "origins": [{
                    "id": "0",
                    "name": "origin1",
                    "isDisabled": true
                }]
            };

            orgUnitRepository.getAllOriginsByName.and.returnValue(utils.getPromise(q, origins));
            patientOriginRepository.get.and.returnValue(utils.getPromise(q, patientOrigin));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {
                "data": {
                    "data": []
                }
            }));
            spyOn(fakeModal, "open").and.returnValue({
                result: utils.getPromise(q, {})
            });

            scope.toggleOriginDisabledState(originToEnableDisable);
            scope.$apply();
            expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedPatientOriginUpsert);
            expect(hustle.publish.calls.argsFor(0)[0]).toEqual({
                "data": expectedPatientOriginUpsert,
                "type": "uploadPatientOriginDetails",
                "locale": "en",
                "desc": "create patient origin origin1"
            }, "dataValues");

            expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedOrgUnitUpsert);
            expect(hustle.publish.calls.argsFor(1)[0]).toEqual({
                "data": expectedOrgUnitUpsert,
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit origin1"
            }, "dataValues");
        });

        it("should enable patient origin", function() {
            scope.orgUnit = {
                "id": "opUnit1Id",
                "name": "OpUnit1"
            };

            var originToEnableDisable = {
                "id": "0",
                "name": "origin1"
            };

            var patientOrigin = {
                "orgUnit": "opUnit1Id",
                "origins": [{
                    "id": "0",
                    "name": "origin1",
                    "isDisabled": true
                }]
            };

            var origins = [{
                "id": "o1",
                "name": "origin1",
                "attributeValues": [{
                    "attribute": {
                        "code": "isDisabled"
                    },
                    "value": "true"
                }]
            }];

            var expectedOrgUnitUpsert = [{
                "id": "o1",
                "name": "origin1",
                "attributeValues": [{
                    "attribute": {
                        "code": "isDisabled"
                    },
                    "value": "false"
                }]
            }];

            var expectedPatientOriginUpsert = {
                "orgUnit": "opUnit1Id",
                "origins": [{
                    "id": "0",
                    "name": "origin1",
                    "isDisabled": false
                }]
            };

            orgUnitRepository.getAllOriginsByName.and.returnValue(utils.getPromise(q, origins));
            patientOriginRepository.get.and.returnValue(utils.getPromise(q, patientOrigin));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {
                "data": {
                    "data": []
                }
            }));
            spyOn(fakeModal, "open").and.returnValue({
                result: utils.getPromise(q, {})
            });

            scope.toggleOriginDisabledState(originToEnableDisable);
            scope.$apply();
            expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedPatientOriginUpsert);
            expect(hustle.publish.calls.argsFor(0)[0]).toEqual({
                "data": expectedPatientOriginUpsert,
                "type": "uploadPatientOriginDetails",
                "locale": "en",
                "desc": "create patient origin origin1"
            }, "dataValues");

            expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedOrgUnitUpsert);
            expect(hustle.publish.calls.argsFor(1)[0]).toEqual({
                "data": expectedOrgUnitUpsert,
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit origin1"
            }, "dataValues");
        });

    });
});
