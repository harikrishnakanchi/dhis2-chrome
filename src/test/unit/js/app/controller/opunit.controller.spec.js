define(["opUnitController", "angularMocks", "utils", "orgUnitGroupHelper", "timecop", "moment", "dhisId", "orgUnitRepository", "patientOriginRepository", "orgUnitGroupSetRepository"], function(OpUnitController, mocks, utils, OrgUnitGroupHelper, timecop, moment, dhisId, OrgUnitRepository, PatientOriginRepository, OrgUnitGroupSetRepository) {
    describe('opUnitController', function() {
        var scope, db, q, hustle, fakeModal,
            opUnitController,
            patientOriginRepository, orgUnitRepository, orgUnitGroupSetRepository, orgUnitGroupHelper,
            orgUnitGroupSets;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
            scope = $rootScope.$new();
            q = $q;
            hustle = $hustle;

            scope.orgUnit = {
                id: 'someOrgUnitId',
                name: 'someOrgUnitName',
                level: 5,
                parent: {
                    id: 'someParentId'
                },
                attributeValues: [{
                    attribute: {
                        code: 'opUnitType'
                    },
                    value: 'Hospital'
                }, {
                    attribute: {
                        code: 'hospitalUnitCode'
                    },
                    value: 'B1'
                }]
            };
            scope.isNewMode = true;
            scope.locale = 'en';
            scope.resourceBundle = {
                'uploadPatientOriginDetailsDesc': 'create patient origin ',
                'upsertOrgUnitDesc': 'upsert org unit'
            };
            scope.startLoading = jasmine.createSpy('startLoading');
            scope.stopLoading = jasmine.createSpy('stopLoading');

            scope.$parent.closeNewForm = jasmine.createSpy();

            Timecop.install();
            Timecop.freeze(new Date('2014-10-29T12:43:54.972Z'));

            fakeModal = {
                close: function() {
                    this.result.confirmCallBack();
                },
                dismiss: function(type) {
                    this.result.cancelCallback(type);
                },
                open: function() {
                    return {
                        result: utils.getPromise(q, {})
                    };
                }
            };

            orgUnitGroupSets = [{
                code: 'hospital_unit_code',
                organisationUnitGroups: [{
                    id: 'orgUnitGroupC2Id',
                    name: 'Unit Code - C2'
                }, {
                    id: 'orgUnitGroupB1Id',
                    name: 'Unit Code - B1'
                }]
            }];

            spyOn(dhisId, 'get').and.returnValue('someMd5Hash');
            spyOn(hustle, 'publish').and.returnValue(utils.getPromise(q, {}));

            patientOriginRepository = new PatientOriginRepository();
            spyOn(patientOriginRepository, 'get').and.returnValue(utils.getPromise(q, {}));
            spyOn(patientOriginRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));


            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.returnValue(utils.getPromise(q, []));
            spyOn(orgUnitRepository, 'getAllOriginsByName').and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitRepository, 'getChildOrgUnitNames').and.returnValue(utils.getPromise(q, []));
            spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, []));
            spyOn(orgUnitRepository, 'upsert').and.callFake(function(orgUnits) { return utils.getPromise(q, [orgUnits]); });

            orgUnitGroupSetRepository = new OrgUnitGroupSetRepository();
            spyOn(orgUnitGroupSetRepository, 'getAll').and.returnValue(utils.getPromise(q, orgUnitGroupSets));

            orgUnitGroupHelper = new OrgUnitGroupHelper();
            spyOn(orgUnitGroupHelper, "createOrgUnitGroups").and.returnValue(utils.getPromise(q, {}));

            opUnitController = new OpUnitController(scope, q, hustle, orgUnitRepository, orgUnitGroupHelper, db, $location, fakeModal, patientOriginRepository, orgUnitGroupSetRepository);
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
            scope.orgUnit.level = 4;

            var expectedOpUnit = {
                "name": "OpUnit1",
                "openingDate": moment().format("YYYY-MM-DD"),
                "id": "someMd5Hash",
                "shortName": "OpUnit1",
                "level": 5,
                "parent": _.pick(scope.orgUnit, ['id', 'name']),
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

            scope.save(opUnit);
            scope.$apply();

            expect(orgUnitRepository.upsert.calls.argsFor(0)[0]).toEqual(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": [expectedOpUnit],
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit"
            }, "dataValues");
        });

        it("should set hospitalUnitCodes on scope on init", function() {
            scope.$apply();
            expect(scope.hospitalUnitCodes).toEqual([{
                id: 'orgUnitGroupB1Id',
                name: 'B1'
            }, {
                id: 'orgUnitGroupC2Id',
                name: 'C2'
            }]);
        });

        describe('editing an existing opUnit', function () {
            it('should set the type and hospitalUnitCode', function () {
                scope.isNewMode = false;
                scope.$apply();

                expect(scope.opUnit.type).toEqual({ name: 'Hospital'});
                expect(scope.opUnit.hospitalUnitCode).toEqual({
                    id: 'orgUnitGroupB1Id',
                    name: 'B1'
                });
            });

            it('should leave the type and hospitalUnitCode undefined if customAttributes are not present', function () {
                scope.orgUnit.attributeValues = null;
                scope.isNewMode = false;
                scope.$apply();

                expect(scope.opUnit.type).toBeUndefined();
                expect(scope.opUnit.hospitalUnitCode).toBeUndefined();
            });
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
            scope.orgUnit.level = 4;

            var expectedOpUnit = {
                "name": "OpUnit1",
                "openingDate": moment().format("YYYY-MM-DD"),
                "id": "someMd5Hash",
                "shortName": "OpUnit1",
                "level": 5,
                "parent": _.pick(scope.orgUnit, ['id', 'name']),
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
                "featureType": "POINT"
            };

            scope.save(opUnit);
            scope.$apply();

            expect(orgUnitRepository.upsert.calls.argsFor(0)[0]).toEqual(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": [expectedOpUnit],
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit"
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
            scope.orgUnit.level = 4;

            var expectedOpUnit = {
                "name": "OpUnit1",
                "openingDate": moment().format("YYYY-MM-DD"),
                "id": "someMd5Hash",
                "shortName": "OpUnit1",
                "level": 5,
                "parent": _.pick(scope.orgUnit, ['id', 'name']),
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
                        "code": 'isNewDataModel'
                    },
                    "value": 'true'
                }]
            };

            scope.save(opUnit);
            scope.$apply();

            expect(orgUnitRepository.upsert.calls.argsFor(0)[0]).toEqual(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": [expectedOpUnit],
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit"
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

            patientOriginRepository.get.and.returnValue(utils.getPromise(q, patientOrigins));

            scope.isNewMode = false;
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

            scope.$apply();
            expect(scope.isDisabled).toBeTruthy();
        });

        it("should disable opunit and all its modules", function() {
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
                "desc": scope.resourceBundle.upsertOrgUnitDesc
            };
            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modulesUnderOpunit));

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
            orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, originOrgUnits));

            scope.update(opUnit);
            scope.$apply();

            expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": [expectedOpUnit],
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit"
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

            var expectedOpUnit = {
                "name": "OpUnit1",
                "id": scope.orgUnit.id,
                "openingDate": moment().format("YYYY-MM-DD"),
                "shortName": "OpUnit1",
                "level": 5,
                "parent": scope.orgUnit.parent,
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
                "featureType": "POINT"
            };

            scope.update(opUnit);
            scope.$apply();

            expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedOpUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": [expectedOpUnit],
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit"
            }, "dataValues");
        });

        it("should take the user to the view page of the parent project on clicking cancel", function() {
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
                "orgUnit": "someMd5Hash",
                "origins": [{
                    "name": "Not Specified",
                    "id": "someMd5Hash",
                    "isDisabled": false,
                    "clientLastUpdated": "2014-10-29T12:43:54.972Z"
                }]
            };

            scope.save(opUnit);
            scope.$apply();

            expect(patientOriginRepository.upsert).toHaveBeenCalledWith(payload);
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": "someMd5Hash",
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
            orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, originOrgUnits));

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

            scope.toggleOriginDisabledState(originToEnableDisable);
            scope.$apply();
            expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedPatientOriginUpsert);
            expect(hustle.publish.calls.argsFor(0)[0]).toEqual({
                "data": "opUnit1Id",
                "type": "uploadPatientOriginDetails",
                "locale": "en",
                "desc": "create patient origin origin1"
            }, "dataValues");

            expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedOrgUnitUpsert);
            expect(hustle.publish.calls.argsFor(1)[0]).toEqual({
                "data": expectedOrgUnitUpsert,
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit"
            }, "dataValues");
        });

        it("should enable patient origin", function() {
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

            scope.toggleOriginDisabledState(originToEnableDisable);
            scope.$apply();
            expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedPatientOriginUpsert);
            expect(hustle.publish.calls.argsFor(0)[0]).toEqual({
                "data": "opUnit1Id",
                "type": "uploadPatientOriginDetails",
                "locale": "en",
                "desc": "create patient origin origin1"
            }, "dataValues");

            expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedOrgUnitUpsert);
            expect(hustle.publish.calls.argsFor(1)[0]).toEqual({
                "data": expectedOrgUnitUpsert,
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": "upsert org unit"
            }, "dataValues");
        });

    });
});