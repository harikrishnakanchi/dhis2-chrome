define(["opUnitController", "angularMocks", "utils", "orgUnitGroupHelper", "timecop", "moment", "dhisId", "orgUnitRepository",
"patientOriginRepository", "orgUnitGroupSetRepository", "customAttributes", "orgUnitMapper", "translationsService"],
    function(OpUnitController, mocks, utils, OrgUnitGroupHelper, timecop, moment, dhisId, OrgUnitRepository,
             PatientOriginRepository, OrgUnitGroupSetRepository, customAttributes, orgUnitMapper, TranslationsService) {
    describe('opUnitController', function() {
        var scope, db, q, hustle, fakeModal, location,
            opUnitController,
            patientOriginRepository, orgUnitRepository, orgUnitGroupSetRepository, orgUnitGroupHelper,
            orgUnitGroupSets, translationsService;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
            scope = $rootScope.$new();
            q = $q;
            hustle = $hustle;
            location = $location;

            scope.orgUnit = {
                id: 'someOrgUnitId',
                name: 'someOrgUnitName',
                level: 5,
                parent: {
                    id: 'someParentId',
                    name: 'parentName'
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
            spyOn(orgUnitGroupHelper, "associateOrgunitsToGroups").and.returnValue(utils.getPromise(q, {}));

            translationsService = new TranslationsService();
            spyOn(translationsService, 'translate').and.returnValue(orgUnitGroupSets);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        var initializeOpUnitController = function () {
            return new OpUnitController(scope, q, hustle, orgUnitRepository, orgUnitGroupHelper, db, location, fakeModal, patientOriginRepository, orgUnitGroupSetRepository, translationsService);
        };

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

        it('should get all organisationUnitGroupSets for the opUnit, translate and set them on scope', function () {
            var mockOrgUnitGroupSets = [{
                name: 'someOrgUnitGroupSet',
                id: 'someOrgUnitGroupSetId',
                attributeValues:[{
                    attribute:{
                        code: 'groupSetLevel',
                    },
                    value: 5
                }],
                organisationUnitGroups: [{
                    'id': 'someOrgUnitGroupId',
                    'name': 'someOrgUnitGroupName'
                }, {
                    'id': 'someOtherOrgUnitGroupId',
                    'name': 'someOrgUnitGroupName',
                }]
            },{
                name: 'someOtherOrgUnitGroupSet',
                attributeValues:[{
                    attribute:{
                        code: 'groupSetLevel',
                    },
                    value: 4
                }],
                organisationUnitGroups: [{
                    'id': 'someAnotherOrgUnitGroupId',
                    'name': 'someAnotherOrgUnitGroupName'
                }]
            }];

            orgUnitGroupSetRepository.getAll.and.returnValue(utils.getPromise(q, mockOrgUnitGroupSets));
            translationsService.translate.and.returnValue([mockOrgUnitGroupSets[0]]);
            spyOn(customAttributes, 'getAttributeValue').and.callFake(function (attributeValues, code) {
                return attributeValues[0].value;
            });
            scope.isNewMode = true;
            opUnitController = initializeOpUnitController();
            scope.$apply();

            expect(translationsService.translate).toHaveBeenCalledWith([mockOrgUnitGroupSets[0]]);
            expect(orgUnitGroupSetRepository.getAll).toHaveBeenCalled();
            expect(scope.orgUnitGroupSets).toEqual([mockOrgUnitGroupSets[0]]);
        });

        it('should set dependant organisationUnitGroupSets for the opUnit on scope if the depending group is selected', function () {
            var mockOrgUnitGroupSets = [{
                name: 'someOrgUnitGroupSet',
                id: 'someOrgUnitGroupSetId'
            }];

            orgUnitGroupSetRepository.getAll.and.returnValue(utils.getPromise(q, mockOrgUnitGroupSets));
            translationsService.translate.and.returnValue(mockOrgUnitGroupSets);
            spyOn(customAttributes, 'getAttributeValue').and.returnValues(5, 'someDependentGroupId');
            scope.isNewMode = true;
            opUnitController = initializeOpUnitController();
            scope.$apply();
            
            expect(scope.orgUnitGroupSets[0].dependentOrgUnitGroupId).toEqual('someDependentGroupId');
        });

        it("should set hospitalUnitCodes on scope on init", function() {
            opUnitController = initializeOpUnitController();
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
            beforeEach(function () {
                scope.isNewMode = false;
                spyOn(orgUnitMapper, 'mapOrgUnitToOpUnit').and.returnValue({});
                opUnitController = initializeOpUnitController();
            });

            it('should build the opunit using orgUnitMapper', function () {
                scope.$apply();
                expect(orgUnitMapper.mapOrgUnitToOpUnit).toHaveBeenCalledWith(scope.orgUnit, scope.orgUnitGroupSets);
            });
        });

        it("should set operation unit for view and show patientOrigins", function() {
            opUnitController = initializeOpUnitController();
            scope.orgUnit = {
                "name": "opUnit1",
                "parent": {
                    "id": "parent"
                },
                "coordinates": "[29,-45]",
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

            expect(scope.isDisabled).toBeFalsy();
            expect(scope.originDetails).toEqual(expectedPatientOrigins.origins);
        });

        it("should disable disable button for opunit", function() {
            opUnitController = initializeOpUnitController();
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
            opUnitController = initializeOpUnitController();
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

        it("should take the user to the view page of the parent project on clicking cancel", function() {
            opUnitController = initializeOpUnitController();
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
                spyOn(customAttributes, 'createAttribute').and.returnValue(createMockAttribute('someType', 'someValue', 'someName'));
                opUnitController = initializeOpUnitController();
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

        describe('save', function () {
            var opUnit, expectedOpUnit, opUnitAttribute, newDataModelAttribute;

            beforeEach(function () {
                opUnitAttribute = {
                    value: "Operation Unit",
                    attribute: {
                        code: "Type"
                    }
                };
                newDataModelAttribute = {
                    value: "true",
                    attribute: {
                        code: "isNewDataModel"
                    }
                };

                opUnit = {
                    "name": "OpUnit1",
                    "type": {
                        "title": "Hospital"
                    },
                    "openingDate": moment().format("YYYY-MM-DD"),
                    "orgUnitGroupSets": {
                        "someOrgUnitGroupSetId": {
                            "id": "someOrgUnitGroupId",
                            "name": "someOrgUnitGroupName"
                        }
                    }
                };

                expectedOpUnit = {
                    "name": "OpUnit1",
                    "openingDate": moment().format("YYYY-MM-DD"),
                    "id": "someMd5Hash",
                    "shortName": "OpUnit1",
                    "level": 5,
                    "parent": _.pick(scope.orgUnit, ['name', 'id']),
                    "attributeValues": [opUnitAttribute, newDataModelAttribute],
                    "organisationUnitGroups": [{
                        "id": "someOrgUnitGroupId",
                        "organisationUnitGroupSet": {
                            "id": "someOrgUnitGroupSetId"
                        }
                    }]
                };

                spyOn(customAttributes, 'createAttribute').and.callFake(function (code, value) {
                    return {
                        value: value,
                        attribute: {
                            code: code
                        }
                    };
                });
            });
            it("should save operation unit", function() {
                opUnitController = initializeOpUnitController();
                scope.orgUnit.level = 4;

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

            it('should associate orgUnits to orgUnitGroups', function () {
                opUnitController = initializeOpUnitController();
                scope.orgUnit.level = 4;
                var orgUnitsToBeAssociated = [expectedOpUnit];
                var syncedOrgUnitGroups = [];
                var localOrgUnitGroups = ["someOrgUnitGroupId"];

                scope.save(opUnit);
                scope.$apply();

                expect(orgUnitGroupHelper.associateOrgunitsToGroups).toHaveBeenCalledWith(orgUnitsToBeAssociated, syncedOrgUnitGroups, localOrgUnitGroups);
            });
        });

        describe('update', function () {
            var opUnit, expectedOpUnit, opUnitAttribute, newDataModelAttribute;
            beforeEach(function () {
                opUnitAttribute = {
                    value: "Operation Unit",
                    attribute: {
                        code: "Type"
                    }
                };
                newDataModelAttribute = {
                    value: "true",
                    attribute: {
                        code: "isNewDataModel"
                    }
                };

                opUnit = {
                    "name": "OpUnit1",
                    "shortName": "OpUnit1",
                    "openingDate": moment().format("YYYY-MM-DD"),
                    "orgUnitGroupSets": {
                        "someOrgUnitGroupSetId": {
                            "id": "someOrgUnitGroupId",
                            "name": "someOrgUnitGroupName"
                        }
                    }
                };

                scope.orgUnit = {
                    "id": "someMd5Hash",
                    "level": 5,
                    "parent": {
                        "id": "parentId",
                        "name": "parentName"
                    },
                };

                expectedOpUnit = {
                    "name": "OpUnit1",
                    "openingDate": moment().format("YYYY-MM-DD"),
                    "id": "someMd5Hash",
                    "shortName": "OpUnit1",
                    "level": 5,
                    "parent": {
                        "id": "parentId",
                        "name": "parentName"
                    },
                    "attributeValues": [opUnitAttribute, newDataModelAttribute],
                    "organisationUnitGroups": [{
                        "id": "someOrgUnitGroupId",
                        "organisationUnitGroupSet": {
                            "id": "someOrgUnitGroupSetId"
                        }
                    }]
                };
                spyOn(customAttributes, 'createAttribute').and.callFake(function (code, value) {
                    return {
                        value: value,
                        attribute: {
                            code: code
                        }
                    };
                });
            });
            it("should update operation unit", function() {
                opUnitController = initializeOpUnitController();

                scope.update(opUnit);
                scope.$apply();

                expect(orgUnitRepository.upsert.calls.argsFor(0)[0]).toEqual(expectedOpUnit);
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": [expectedOpUnit],
                    "type": "upsertOrgUnit",
                    "locale": "en",
                    "desc": "upsert org unit"
                }, "dataValues");
            });

            it('should associate orgUnits to orgUnitGroups', function () {
                opUnitController = initializeOpUnitController();
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

                scope.orgUnit.organisationUnitGroups = [{
                    id: 'orgUnitGroupId',
                    organisationUnitGroupSet: {
                        id: 'orgUnitGroupSetId'
                    }
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modulesUnderOpunit));
                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, originOrgUnits));

                var orgUnitsToBeAssociated = [expectedOpUnit].concat(modulesUnderOpunit[0]).concat(originOrgUnits);
                var syncedOrgUnitGroups = ["orgUnitGroupId"];
                var localOrgUnitGroups = ["someOrgUnitGroupId"];

                scope.update(opUnit);
                scope.$apply();

                expect(orgUnitGroupHelper.associateOrgunitsToGroups).toHaveBeenCalledWith(orgUnitsToBeAssociated, syncedOrgUnitGroups, localOrgUnitGroups);
            });

        });

        it("should disable patient origin", function() {
            opUnitController = initializeOpUnitController();
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
            opUnitController = initializeOpUnitController();
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