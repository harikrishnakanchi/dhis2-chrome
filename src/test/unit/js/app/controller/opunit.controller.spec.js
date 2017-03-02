define(["opUnitController", "angularMocks", "utils", "orgUnitGroupHelper", "timecop", "moment", "dhisId", "orgUnitRepository", "patientOriginRepository", "orgUnitGroupSetRepository", "customAttributes", "orgUnitMapper"],
    function(OpUnitController, mocks, utils, OrgUnitGroupHelper, timecop, moment, dhisId, OrgUnitRepository, PatientOriginRepository, OrgUnitGroupSetRepository, customAttributes, orgUnitMapper) {
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
                attributeValues: [createMockAttribute('opUnitType', 'Hospital'),
                    createMockAttribute('hospitalUnitCode', 'B1')]
            };
            scope.isNewMode = true;
            scope.locale = 'en';
            scope.resourceBundle = {
                'uploadPatientOriginDetailsDesc': 'create patient origin {{origin_name}}',
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

        var createMockAttribute = function (code, value, name) {
            var attribute = {
                "created": "2014-10-29T12:43:54.972Z",
                "lastUpdated": "2014-10-29T12:43:54.972Z",
                "attribute": {
                    "code": code
                },
                "value": value
            };
            if (name) {
                attribute.attribute.name = name;
            }
            return attribute;
        };

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

            var attributes = [createMockAttribute('someType', 'someValue', 'someName'),
                createMockAttribute('someType', 'someValue', 'someName'),
                createMockAttribute('someType', 'someValue', 'someName'),
                createMockAttribute('someType', 'someValue', 'someName')
            ];
            var expectedOpUnit = {
                "name": "OpUnit1",
                "openingDate": moment().format("YYYY-MM-DD"),
                "id": "someMd5Hash",
                "shortName": "OpUnit1",
                "level": 5,
                "parent": _.pick(scope.orgUnit, ['id', 'name']),
                "attributeValues": attributes
            };

            spyOn(customAttributes, 'createAttribute').and.returnValue(createMockAttribute('someType', 'someValue', 'someName'));
            spyOn(customAttributes, 'cleanAttributeValues').and.returnValue(attributes);
            scope.save(opUnit);
            scope.$apply();

            expect(customAttributes.createAttribute).toHaveBeenCalledWith(customAttributes.OPERATION_UNIT_TYPE_CODE, "Hospital");
            expect(customAttributes.createAttribute).toHaveBeenCalledWith(customAttributes.TYPE, "Operation Unit");
            expect(customAttributes.createAttribute).toHaveBeenCalledWith(customAttributes.HOSPITAL_UNIT_CODE, "Unit Code - A");
            expect(customAttributes.createAttribute).toHaveBeenCalledWith(customAttributes.NEW_DATA_MODEL_CODE, "true");
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

            spyOn(customAttributes, 'createAttribute').and.returnValue(createMockAttribute('someType', 'someValue'));
            spyOn(customAttributes, 'cleanAttributeValues').and.returnValue(createMockAttribute('someType', 'someValue'));
            scope.save(opUnit);
            scope.$apply();

            expect(orgUnitRepository.upsert.calls.argsFor(0)[0].coordinates).toEqual("[25,50]");
            expect(orgUnitRepository.upsert.calls.argsFor(0)[0].featureType).toEqual("POINT");
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

            spyOn(customAttributes, 'createAttribute').and.returnValue(createMockAttribute('someType', 'someValue'));
            scope.save(opUnit);
            scope.$apply();

            expect(customAttributes.createAttribute).not.toHaveBeenCalledWith(customAttributes.HOSPITAL_UNIT_CODE, 'Unit Code - A');
        });

        it("should set operation unit for view and show patientOrigins", function() {
            scope.orgUnit = {
                "name": "opUnit1",
                "parent": {
                    "id": "parent"
                },
                "coordinates": "[29,-45]",
                "attributeValues": []
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

            spyOn(customAttributes, 'getAttributeValue').and.callFake(function (attributeValues, code) {
                var fakeAttributeValues = {
                    opUnitType: 'Health Center',
                    hospitalUnitCode: 'Unit Code - B1'
                };
                return fakeAttributeValues[code];
            });

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
                "attributeValues": []
            };
            scope.isNewMode = false;

            spyOn(customAttributes, 'getBooleanAttributeValue').and.returnValue(true);
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
                "attributeValues": [createMockAttribute('isDisabled', 'true')],
                "parent": {
                    "id": "opunit1",
                }
            }, {
                "name": "opunit1",
                "id": "opunit1",
                "datasets": [],
                "attributeValues": [createMockAttribute('isDisabled', 'true')],
                "parent": {
                    "id": "parent"
                }
            }];
            var expectedHustleMessage = {
                "data": [module, opunit],
                "type": "upsertOrgUnit",
                "locale": "en",
                "desc": scope.resourceBundle.upsertOrgUnitDesc
            };
            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modulesUnderOpunit));

            spyOn(orgUnitMapper, 'disable').and.returnValue(expectedOrgUnits);
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

            var attributes = [createMockAttribute('someType', 'someValue'),
                createMockAttribute('someType', 'someValue'),
                createMockAttribute('someType', 'someValue'),
                createMockAttribute('someType', 'someValue')];

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
                "attributeValues": attributes
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

            spyOn(customAttributes, 'createAttribute').and.returnValue(createMockAttribute('someType', 'someValue'));
            spyOn(customAttributes, 'cleanAttributeValues').and.returnValue(attributes);
            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modulesUnderOpunit));
            orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, originOrgUnits));

            scope.update(opUnit);
            scope.$apply();

            expect(customAttributes.createAttribute).toHaveBeenCalledWith(customAttributes.OPERATION_UNIT_TYPE_CODE, "Hospital");
            expect(customAttributes.createAttribute).toHaveBeenCalledWith(customAttributes.TYPE, "Operation Unit");
            expect(customAttributes.createAttribute).toHaveBeenCalledWith(customAttributes.HOSPITAL_UNIT_CODE, "Unit Code - A");
            expect(customAttributes.createAttribute).toHaveBeenCalledWith(customAttributes.NEW_DATA_MODEL_CODE, "true");
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

            spyOn(customAttributes, 'createAttribute').and.returnValue(createMockAttribute('someType', 'someValue'));
            scope.update(opUnit);
            scope.$apply();

            expect(orgUnitRepository.upsert.calls.argsFor(0)[0].coordinates).toEqual("[25,50]");
            expect(orgUnitRepository.upsert.calls.argsFor(0)[0].featureType).toEqual("POINT");
        });

        it("should take the user to the view page of the parent project on clicking cancel", function() {
            scope.closeForm();

            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(scope.orgUnit);
        });

        describe('Not Specified origin for new opunit', function () {
            var opUnit, payload, publishPayload;

            beforeEach(function () {
                opUnit = {
                    id: 'someOpUnitId',
                    name: 'someOpUnitName',
                    type: 'type',
                    hospitalUnitCode: 'code'
                };
                payload = {
                    orgUnit: 'someMd5Hash',
                    origins: [{
                        name: 'Not Specified',
                        id: 'someMd5Hash',
                        isDisabled: false,
                        clientLastUpdated: '2014-10-29T12:43:54.972Z'
                    }]
                };
                publishPayload = {
                        "data": "someMd5Hash",
                        "type": "uploadPatientOriginDetails",
                        "locale": "en",
                        "desc": "create patient origin Not Specified"
                    };
            });

            it('should be created when geographicOriginDisabled is false', function () {
                scope.geographicOriginDisabled = false;
                scope.save(opUnit);
                scope.$apply();

                expect(patientOriginRepository.upsert).toHaveBeenCalledWith(payload);
                expect(hustle.publish).toHaveBeenCalledWith(publishPayload, 'dataValues');
            });

            it('should not be created when geographicOriginDisabled is true', function () {
                scope.geographicOriginDisabled = true;
                scope.save(opUnit);
                scope.$apply();

                expect(patientOriginRepository.upsert).not.toHaveBeenCalled();
                expect(hustle.publish).not.toHaveBeenCalledWith(publishPayload, "dataValues");
            });
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
                "attributeValues": [createMockAttribute('isLineListService', 'true')]
            }];

            var originOrgUnits = [{
                "id": "child1",
                "name": "child1"
            }, {
                "id": "child2",
                "name": "child2"
            }];

            spyOn(customAttributes, 'createAttribute').and.returnValue(createMockAttribute('someType', 'someValue'));
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
                "id": "o1",
                "name": "origin1"
            };

            var patientOrigin = {
                "orgUnit": "opUnit1Id",
                "origins": [{
                    "id": "o1",
                    "name": "origin1",
                    "isDisabled": false
                }]
            };

            var origins = [{
                "id": "o1",
                "name": "origin1",
                "attributeValues": [createMockAttribute('isDisabled', 'false')]
            }, {
                "id": "o3",
                "name": "origin1",
                "attributeValues": [createMockAttribute('isSomething', 'false')]
            }];

            var expectedOrgUnitUpsert = [{
                "id": "o1",
                "name": "origin1",
                "attributeValues": [createMockAttribute('isDisabled', 'true')]
            }, {
                "id": "o3",
                "name": "origin1",
                "attributeValues": [createMockAttribute('isSomething', 'false'),
                    createMockAttribute('isDisabled', 'true')]

            }];

            var expectedPatientOriginUpsert = {
                "orgUnit": "opUnit1Id",
                "origins": [{
                    "id": "o1",
                    "name": "origin1",
                    "isDisabled": true
                }]
            };

            spyOn(customAttributes, 'createAttribute').and.callFake(function (code, value) {
                return createMockAttribute(code, value);
            });
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
                "attributeValues": [createMockAttribute('isDisabled', 'true')]
            }];

            var expectedOrgUnitUpsert = [{
                "id": "o1",
                "name": "origin1",
                "attributeValues": [createMockAttribute('isDisabled', 'false')]
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