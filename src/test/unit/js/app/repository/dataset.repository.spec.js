define(["datasetRepository", "angularMocks", "utils", "testData", "timecop"], function(DatasetRepository, mocks, utils, testData, timecop) {
    xdescribe("dataset repository", function() {
        var db, mockDB, mockStore, datasetRepository, q, scope, sectionsdata, datasetsdata, dataElementsdata, sectionStore, dataElementStore;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            scope = $rootScope.$new();


            sectionsdata = testData.get("sections");
            datasetsdata = testData.get("dataSets");
            dataElementsdata = testData.get("dataElements");

            sectionStore = utils.getMockStore(q, "", sectionsdata);
            dataElementStore = utils.getMockStore(q, "", dataElementsdata);
            datasetRepository = new DatasetRepository(mockDB.db, q);

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should find all datasets", function() {
            var datasetIds = ["ds1", "ds2"];
            datasetRepository.findAllDhisDatasets(datasetIds);
            scope.$apply();

            expect(mockStore.each).toHaveBeenCalled();
            expect(mockStore.each.calls.argsFor(0)[0].inList).toEqual(datasetIds);
        });

        it("should get all new aggregate data sets", function() {
            var allDataSets = [{
                "id": "dataSet1",
                "name": "NeoNat",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "isOriginDataset"
                    },
                    "value": "false"
                }]
            }, {
                "id": "dataSet2",
                "name": "Obgyn",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "false"
                }]
            }, {
                "id": "dataSet3",
                "name": "ER linelist",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "isLineListService"
                    },
                    "value": "true"
                }]
            }, {
                "id": "geographicOrigin",
                "name": "Geographic Origin",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "isLineListService"
                    },
                    "value": "false"
                }, {
                    "attribute": {
                        "code": "isOriginDataset"
                    },
                    "value": "true"
                }]
            }];

            var expected = [{
                "id": "dataSet1",
                "name": "NeoNat",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "isOriginDataset"
                    },
                    "value": "false"
                }]
            }];
            mockStore.getAll.and.returnValue(utils.getPromise(q, allDataSets));
            var result;
            datasetRepository.getAllAggregateDatasets().then(function(r) {
                result = r;
            });
            scope.$apply();
            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(expected);
        });

        it("should get datasets for OrgUnit", function() {
            var expectedDatasets = [{
                "id": "ds1"
            }];
            mockStore.each.and.returnValue(utils.getPromise(q, expectedDatasets));

            var actualValues;
            datasetRepository.getAllForOrgUnit("ou1").then(function(data) {
                actualValues = data;
            });

            scope.$apply();

            expect(actualValues).toEqual(expectedDatasets);
        });

        it("should get all the dataset ids", function() {
            var result;

            var allDataSets = [{
                "id": 123,
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }]
            }];
            mockStore.getAll.and.returnValue(utils.getPromise(q, allDataSets));

            datasetRepository.getAllDatasetIds().then(function(data) {
                result = data;
            });
            scope.$apply();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual([123]);
        });

        it("should get enriched datasets", function() {
            var datasets = [{
                "id": "DS_OPD",
                "name": "DS_OPD",
                "organisationUnits": [{
                    "id": "mod1"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel",
                    },
                    "value": "false"
                }],
                "sections": [{
                    "id": "Sec1"
                }, {
                    "id": "Sec2"
                }]
            }];

            var expectedEnrichedDS = [{
                "id": "DS_OPD",
                "name": "DS_OPD",
                "organisationUnits": [{
                    "id": "mod1"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "false"
                }],
                "sections": [{
                    "id": "Sec1",
                    "dataElements": [{
                        "id": "DE1",
                        "name": "DE1 - ITFC",
                        "isIncluded": true,
                        "formName": "DE1"
                    }, {
                        "id": "DE2",
                        "name": "DE2 - ITFC",
                        "isIncluded": true,
                        "formName": "DE2"
                    }, {
                        "id": "DE4",
                        "name": "DE4 - ITFC",
                        "isIncluded": true,
                        "formName": "DE4"
                    }],
                    "isIncluded": true
                }, {
                    "id": "Sec2",
                    "dataElements": [{
                        "id": "DE1",
                        "name": "DE1 - ITFC",
                        "isIncluded": true,
                        "formName": "DE1"
                    }],
                    "isIncluded": true
                }]
            }];

            var db = utils.getMockDB(q).db;

            db.objectStore.and.callFake(function(storeName) {
                if (storeName === "sections")
                    return sectionStore;
                if (storeName === "dataElements")
                    return dataElementStore;
                return utils.getMockStore(q, "", testData.get(storeName));
            });

            datasetRepository = new DatasetRepository(db, q);

            var actualEnrichedDS;

            datasetRepository.getEnriched(datasets).then(function(data) {
                actualEnrichedDS = data;
            });

            scope.$apply();
            expect(actualEnrichedDS).toEqual(expectedEnrichedDS);
        });

        it("should get all origin datasets", function() {
            var allDataSets = [{
                "id": "dataSet1",
                "name": "NeoNat",
                "attributeValues": [{
                    "attribute": {
                        "code": "isOriginDataset"
                    },
                    "value": "true"
                }]
            }, {
                "id": "dataSet2",
                "name": "Obgyn",
                "attributeValues": [{
                    "attribute": {
                        "code": "isOriginDataset"
                    },
                    "value": "false"
                }]
            }];

            var expectedResult = [{
                "id": "dataSet1",
                "name": "NeoNat",
                "attributeValues": [{
                    "attribute": {
                        "code": "isOriginDataset"
                    },
                    "value": "true"
                }]
            }];

            mockStore.getAll.and.returnValue(utils.getPromise(q, allDataSets));
            var actualResult;
            datasetRepository.getOriginDatasets().then(function(r) {
                actualResult = r;
            });
            scope.$apply();
            expect(actualResult).toEqual(expectedResult);
        });

        it("should associate org units to datasets", function() {
            var datasets = [{
                "id": "dataSet1",
                "name": "NeoNat"
            }];

            var orgUnits = [{
                "id": "ou1",
                "name": "ou1"
            }];

            var expectedDatasetUpsert = [{
                "id": "dataSet1",
                "name": "NeoNat",
                "organisationUnits": orgUnits,
                "clientLastUpdated": "2014-05-30T12:43:54.972Z",
                "orgUnitIds": ["ou1"]
            }];
            datasetRepository.associateOrgUnits(datasets, orgUnits);

            expect(mockStore.upsert).toHaveBeenCalledWith(expectedDatasetUpsert);
        });
    });
});
