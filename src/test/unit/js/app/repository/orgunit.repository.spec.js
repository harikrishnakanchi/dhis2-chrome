define(["orgUnitRepository", "utils", "angularMocks", "timecop", "lodash"], function(OrgUnitRepository, utils, mocks, timecop, _) {
    describe('orgUnitRepository', function() {
        var mockOrgStore, mockDb, orgUnitRepository, q, orgUnits, scope, company, country, project, opUnit, originOU, opcenter, module1, module2;
        var getAttr = function(key, value) {
            return {
                "attribute": {
                    "code": key
                },
                "value": value
            };
        };

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            company = {
                "id": "company1",
                "name": "MSF",
                "level": 1,
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Company"
                }]
            };

            opcenter = {
                "id": "oc1",
                "name": "OCP",
                "level": 2,
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Operational Center"
                }],
                "parent": {
                    "id": "company1"
                }
            };

            country = {
                "id": "country1",
                "name": "country",
                "level": 3,
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Country"
                }],
                "parent": {
                    "id": "oc1"
                }
            };

            project = {
                "id": "project1",
                "name": "project",
                "level": 4,
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Project"
                }, {
                    "attribute": {
                        "code": "projCode"
                    },
                    "value": "PRJ001"
                }],
                "parent": {
                    "id": "country1"
                }
            };

            opUnit = {
                "id": "opUnit1",
                "name": "opUnit",
                "level": 5,
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Operation Unit"
                }],
                "parent": {
                    "id": "project1"
                }
            };

            module1 = {
                "id": "module1",
                "name": "module 1",
                "level": 6,
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "parent": {
                    "id": "opUnit1"
                }
            };

            module2 = {
                "id": "module2",
                "name": "module 2",
                "level": 6,
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "parent": {
                    "id": "opUnit1"
                },
                "children": []
            };

            originOU = {
                "id": "originOU1",
                "name": "origin OU 1",
                "level": 7,
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Patient Origin"
                }],
                "parent": {
                    "id": "module1"
                }
            };

            orgUnits = [company, opcenter, country, project, opUnit, module1, module2, originOU];

            mockDb = utils.getMockDB(q, module1, _.clone(orgUnits, true), [module1, module2]);
            mockOrgStore = mockDb.objectStore;

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));

            orgUnitRepository = new OrgUnitRepository(mockDb.db, q);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should return the root orgUnit and its descendants up to specified maxlevel", function() {
            var actual;

            orgUnitRepository.getOrgUnitAndDescendants(3).then(function(data){
                actual = data;
            });

            scope.$apply();

            var expected = [company, opcenter, country];
            expect(actual).toEqual(expected);
        });


        it("should return orgUnit and its descendants based on orgUnitId and maxlevel", function() {
            var actual;

            orgUnitRepository.getOrgUnitAndDescendants(6, "project1").then(function(data){
                actual = data;
            });

            scope.$apply();

            var expected = [project, opUnit, module1, module2];
            expect(actual).toEqual(expected);
        });

        it("should upsert org units with clientlastupdated and parentId field when data is changed locally", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1,
                "lastUpdated": "2014-05-30T12:43:54.972Z",
                "parent": {
                    "id": "p1"
                }
            }];

            var expectedUpsertPayload = [{
                "id": "org_0",
                "level": 1,
                "lastUpdated": "2014-05-30T12:43:54.972Z",
                "clientLastUpdated": "2014-05-30T12:43:54.972Z",
                "parent": {
                    "id": "p1"
                },
                "parentId": "p1"
            }];

            orgUnitRepository.upsert(orgUnit).then(function(data) {
                expect(data).toEqual(expectedUpsertPayload);
            });

            scope.$apply();

            expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedUpsertPayload);
        });

        it("should upsert org units with only the parentId field when data is changed on dhis", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1,
                "lastUpdated": "2014-05-30T12:43:54.972Z",
                "parent": {
                    "id": "p1"
                }
            }];

            var expectedUpsertPayload = [{
                "id": "org_0",
                "level": 1,
                "parent": {
                    "id": "p1"
                },
                "parentId": "p1",
                "lastUpdated": "2014-05-30T12:43:54.972Z"
            }];

            orgUnitRepository.upsertDhisDownloadedData(orgUnit).then(function(data) {
                expect(data).toEqual(expectedUpsertPayload);
            });

            scope.$apply();

            expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedUpsertPayload);
        });

        it("should get orgUnit by id", function() {
            var projectId = "proj1";
            var orgUnit = orgUnitRepository.get(projectId);
            scope.$apply();

            expect(mockOrgStore.find).toHaveBeenCalledWith(projectId);
        });

        it("should find all orgunits by ids", function() {
            var projectIds = ["proj1", "proj2"];
            var orgUnit = orgUnitRepository.findAll(projectIds);
            scope.$apply();

            expect(mockOrgStore.each).toHaveBeenCalled();
            expect(mockOrgStore.each.calls.argsFor(0)[0].inList).toEqual(projectIds);
        });

        it("should find all org units by parent ids", function() {
            var actualOrgUnits;
            var expectedOrgUnits = [module1, module2];
            orgUnitRepository.findAllByParent(["project1"]).then(function(orgUnits) {
                actualOrgUnits = orgUnits;
            });

            scope.$apply();
            expect(actualOrgUnits).toEqual(expectedOrgUnits);
        });

        it("should get all attributes of parent project and opUnit", function() {
            var actualAttributes;
            var expectedAttributes = [{
                "attribute": {
                    "code": "isNewDataModel"
                },
                "value": "true"
            }, {
                "attribute": {
                    "code": "Type"
                },
                "value": "Operation Unit"
            }, {
                "attribute": {
                    "code": "isNewDataModel"
                },
                "value": "true"
            }, {
                "attribute": {
                    "code": "Type"
                },
                "value": "Project"
            }, {
                "attribute": {
                    "code": "projCode"
                },
                "value": "PRJ001"
            }];

            orgUnitRepository.getProjectAndOpUnitAttributes(module1.id).then(function(data) {
                actualAttributes = data;
            });

            scope.$apply();
            expect(actualAttributes).toEqual(expectedAttributes);
        });

        it("should get all projects", function() {
            var expectedProject = _.cloneDeep(project);

            orgUnitRepository.getAllProjects().then(function(data) {
                expect(data.length).toEqual(1);
                expect(data[0]).toEqual(expectedProject);
            });

            scope.$apply();
        });

        it("should get parent project", function() {
            mockOrgStore.find.and.callFake(function(id) {
                if (id === "module1")
                    return utils.getPromise(q, module1);
                if (id === "opUnit1")
                    return utils.getPromise(q, opUnit);
                if (id === "project1")
                    return utils.getPromise(q, project);
                return utils.getPromise(q, {});
            });

            var actualProject;
            orgUnitRepository.getParentProject(module1.id).then(function(data) {
                actualProject = data;
            });

            scope.$apply();
            expect(actualProject).toEqual(project);
        });

        it("should get all modules which are children of the given org units", function() {
            var actualModules;
            mockOrgStore.each.and.callFake(function(query) {
                if (query.inList.length === 1 && query.inList[0] === opUnit.id)
                    return utils.getPromise(q, [module1, module2]);
                if (query.inList[0] === opUnit.id && query.inList[1] === module1.id)
                    return utils.getPromise(q, [opUnit, module1]);
            });

            orgUnitRepository.getAllModulesInOrgUnits([opUnit.id, module1.id]).then(function(data) {
                actualModules = data;
            });

            scope.$apply();

            expect(actualModules).toEqual([module1, module2]);
        });

        it("should get all origins which are children of the given org units", function() {
            var actualOrigins;
            origin1 = {
                "id": "origin1",
                "name": "origin1",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Origin"
                }],
                "parent": {
                    "id": "module1"
                },
                "children": [{
                    "id": "Unknown",
                    "name": "Unknown"
                }]
            };

            mockOrgStore.each.and.callFake(function(query) {
                if (query.inList[0] === module.id && query.inList[1] === origin1.id)
                    return utils.getPromise(q, [module, origin1]);
                if (query.inList.length === 1 && query.inList[0] === module.id)
                    return utils.getPromise(q, [origin1]);
            });

            orgUnitRepository.getAllOriginsInOrgUnits([module.id]).then(function(data) {
                actualOrigins = data;
            });

            scope.$apply();
            expect(actualOrigins).toEqual([origin1]);
        });

        it("should get all op units which are children of the given org units", function() {
            var anotherOpUnit = {
                "id": "opUnit2",
                "name": "opUnit",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Operation Unit"
                }],
                "children": [{
                    "id": "module",
                    "name": "module"
                }]
            };


            mockOrgStore.each.and.callFake(function(query) {
                if (query.inList[0] === project.id && query.inList[1] === opUnit.id) {
                    return utils.getPromise(q, [project, opUnit]);
                } else if (query.inList.length === 1 && query.inList[0] === project.id) {
                    return utils.getPromise(q, [anotherOpUnit]);
                } else {
                    return utils.getPromise(q, []);
                }
            });

            var actualOpUnits;
            orgUnitRepository.getAllOpUnitsInOrgUnits([project.id, opUnit.id]).then(function(data) {
                actualOpUnits = data;
            });

            scope.$apply();

            expect(actualOpUnits).toEqual([opUnit, anotherOpUnit]);
        });

        it("should get child org unit names", function() {
            var orgUnitNames;
            orgUnitRepository.getChildOrgUnitNames(opUnit).then(function(data) {
                orgUnitNames = data;
            });

            scope.$apply();

            expect(orgUnitNames).toEqual(["module 1", "module 2"]);
        });

        it("should get all active origins by name", function() {
            var origins;

            mockOrgStore.each.and.callFake(function(query) {
                if (query.inList[0] === "module1")
                    return utils.getPromise(q, [originOU]);
                if (query.inList[0] === "opUnit1")
                    return utils.getPromise(q, [module1]);

            });

            orgUnitRepository.getAllOriginsByName(opUnit, "origin OU 1", true).then(function(data) {
                origins = data;
            });

            scope.$apply();

            expect(origins).toEqual([originOU]);
        });

        describe('enrichWithParent', function () {
            var orgUnit, parentOrgUnit;

            beforeEach(function () {
                orgUnit = {
                    id: 'someId',
                    parent: {
                        id: 'parentId'
                    }
                };
                parentOrgUnit = {
                    id: 'parentId',
                    name: 'parentName'
                };
                mockOrgStore.find.and.returnValue(utils.getPromise(q, parentOrgUnit));
            });

            it('should enrich the orgUnit with the parent orgUnit', function () {
                orgUnitRepository.enrichWithParent(orgUnit).then(function (enrichedOrgUnits) {
                    expect(enrichedOrgUnits.parent).toEqual(parentOrgUnit);
                });
                scope.$apply();
            });

            it('should enrich a collection of orgUnits', function () {
                orgUnitRepository.enrichWithParent([orgUnit]).then(function (enrichedOrgUnits) {
                    expect(_.map(enrichedOrgUnits, 'parent')).toEqual([parentOrgUnit]);
                });
                scope.$apply();
            });

            it('should return the original object if there is no parent', function () {
                orgUnit = {
                    id: 'someId'
                };
                orgUnitRepository.enrichWithParent([orgUnit]).then(function (enrichedOrgUnits) {
                    expect(enrichedOrgUnits).toEqual([orgUnit]);
                });
                scope.$apply();
            });
        });

        describe('associateDataSetsToOrgUnits', function () {
           it('should associate the dataSets with the orgUnit', function () {
               var orgunits = [{
                   id: 'someOrgUnitId',
                   name: 'someOrgUnitName',
                   dataSets: [{id: 'someOtherDataSetId'}]
               }, {
                   id: 'someOtherOrgUnitId',
                   name: 'someOrgUnitName',
                   dataSets: [{id: 'someOtherDataSetId'}]
               }];
               var expectedOrgUnitUpsert = {
                   "id": "someOrgUnitId",
                   "name": "someOrgUnitName",
                   "dataSets": [{"id": "someOtherDataSetId"}, {"id": "someDataSetId"}]
               };
               var expectedSomeOtherOrgUnitUpsert = {
                   "id": "someOtherOrgUnitId",
                   "name": "someOrgUnitName",
                   "dataSets": [{"id": "someOtherDataSetId"}, {"id": "someDataSetId"}]
               };
               mockOrgStore.each.and.returnValue(utils.getPromise(q, orgunits));

               orgUnitRepository.associateDataSetsToOrgUnits(['someDataSetId'], orgunits);
               scope.$apply();

               expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedOrgUnitUpsert);
               expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedSomeOtherOrgUnitUpsert);
           });

            it('should not associate the already existing dataSet with orgUnit', function () {
                var orgunits = [{
                    id: 'someOrgUnitId',
                    name: 'someOrgUnitName',
                    dataSets: [{id: 'someOtherDataSetId'}]
                }, {
                    id: 'someOtherOrgUnitId',
                    name: 'someOrgUnitName',
                    dataSets: [{id: 'someOtherDataSetId'}]
                }];
                var expectedOrgUnitUpsert = {
                    "id": "someOrgUnitId",
                    "name": "someOrgUnitName",
                    "dataSets": [{"id": "someOtherDataSetId"}]
                };
                var expectedSomeOtherOrgUnitUpsert = {
                    "id": "someOtherOrgUnitId",
                    "name": "someOrgUnitName",
                    "dataSets": [{"id": "someOtherDataSetId"}]
                };
                mockOrgStore.each.and.returnValue(utils.getPromise(q, orgunits));

                orgUnitRepository.associateDataSetsToOrgUnits(['someOtherDataSetId'], orgunits);
                scope.$apply();

                expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedOrgUnitUpsert);
                expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedSomeOtherOrgUnitUpsert);
            });

        });

        describe('removeDataSetsToOrgUnits', function () {
            it('should remove the dataSets from the orgUnits', function () {
                var orgUnits = [{
                    id: 'someOrgUnitId',
                    name: 'someOrgUnitName',
                    dataSets: [{id: 'someDataSetId'}, {
                        id: 'dataSetToBeRemoved'
                    }]
                }, {
                    id: 'someOtherOrgUnitId',
                    name: 'someOtherOrgUnitName',
                    dataSets: [{id: 'someDataSetId'}, {id: 'dataSetToBeRemoved'}]
                }];
                var expectedOrgUnitUpsert = {
                    "id": "someOrgUnitId",
                    "name": "someOrgUnitName",
                    "dataSets": [{"id": "someDataSetId"}]
                };

                var expectedSomeOtherOrgUnitUpsert = {
                    "id": "someOtherOrgUnitId",
                    "name": "someOtherOrgUnitName",
                    "dataSets": [{"id": "someDataSetId"}]
                };
                mockOrgStore.each.and.returnValue(utils.getPromise(q, orgUnits));

                orgUnitRepository.removeDataSetsFromOrgUnits(['dataSetToBeRemoved'], orgUnits);
                scope.$apply();

                expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedOrgUnitUpsert);
                expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedSomeOtherOrgUnitUpsert);
            });
        });

        describe('getAllDataSets',function () {
            it('should return all the associatewd dataSets for the orgUnit id', function () {
                var dataSets = [{
                    id: 'someDataSetId'
                }];
                var mockOrgUnit = {
                    id: 'mockOrgUnitId',
                    dataSets: dataSets
                };
                spyOn(orgUnitRepository, 'get').and.returnValue(mockOrgUnit);
                var expectedDataSets = dataSets;
                orgUnitRepository.getAllDataSetsForOrgUnit(mockOrgUnit.id).then(function (dataSets) {
                    expect(expectedDataSets).toEqual(dataSets);
                });
            });
        });

    });
});
