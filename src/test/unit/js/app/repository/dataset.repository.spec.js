define(["datasetRepository", "angularMocks", "utils", "testData", "timecop"], function(DatasetRepository, mocks, utils, testData, timecop) {
    describe("dataset repository", function() {
        var db, mockDB, mockStore, datasetRepository, q, scope, sectionsdata, datasetsdata, dataElementsdata, sectionStore, dataElementStore;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            scope = $rootScope.$new();


            sectionsdata = testData.get("sections");
            datasetsdata = testData.get("dataSets");
            dataElementsdata = testData.get("dataElements");

            sectionStore = utils.getMockStore(q, '', sectionsdata);
            dataElementStore = utils.getMockStore(q, '', dataElementsdata);
            datasetRepository = new DatasetRepository(mockDB.db, q);

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should get all data sets", function() {
            var allDataSets = [{
                "id": 123,
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": 'true'
                }]
            }];
            mockStore.getAll.and.returnValue(utils.getPromise(q, allDataSets));
            var result;
            datasetRepository.getAll().then(function(r) {
                result = r;
            });
            scope.$apply();
            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(allDataSets);
        });

        it("should get all new data sets", function() {
            var allDataSets = [{
                "id": "dataSet1",
                "name": "NeoNat",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": 'true'
                }]
            }, {
                "id": "dataSet2",
                "name": "Obgyn",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": 'false'
                }]
            }, {
                "id": "dataSet3",
                "name": "Ped-v1"
            }];

            var expected = [{
                "id": "dataSet1",
                "name": "NeoNat",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": 'true'
                }]
            }];
            mockStore.getAll.and.returnValue(utils.getPromise(q, allDataSets));
            var result;
            datasetRepository.getAll().then(function(r) {
                result = r;
            });
            scope.$apply();
            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(expected);
        });

        it("should get datasets for OrgUnit", function() {
            var expectedDatasets = [{
                'id': 'ds1'
            }];
            mockStore.each.and.returnValue(utils.getPromise(q, expectedDatasets));

            var actualValues;
            datasetRepository.getAllForOrgUnit("ou1").then(function(data) {
                actualValues = data;
            });

            scope.$apply();

            expect(actualValues).toEqual(expectedDatasets);
        });


        it("should update data sets", function() {
            var datasets = [{
                "id": "DS_Physio",
                "organisationUnits": [{
                    "name": "Mod1",
                    "id": "hvybNW8qEov"
                }]
            }];

            var result = datasetRepository.upsert(datasets);

            var expectedDatasets = [{
                "id": "DS_Physio",
                "clientLastUpdated": "2014-05-30T12:43:54.972Z",
                "organisationUnits": [{
                    "name": "Mod1",
                    "id": "hvybNW8qEov"
                }],
                "orgUnitIds": ["hvybNW8qEov"]
            }];

            expect(mockStore.upsert).toHaveBeenCalledWith(expectedDatasets);
        });

        it("should get dataset specified by id", function() {
            var result;

            var dataset = {
                'id': 'ds1'
            };

            mockStore.find.and.returnValue(utils.getPromise(q, dataset));

            datasetRepository.get('ds1').then(function(data) {
                result = data;
            });
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith('ds1');
            expect(result).toEqual(dataset);
        });

        it("should get all the dataset ids", function() {
            var result;

            var allDataSets = [{
                "id": 123,
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": 'true'
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

        it("should get enriched dataset", function() {
            var dataSet = {
                "name": "OPD",
                "id": "DS_OPD",
                "organisationUnits": [{
                    "id": "mod1"
                }],
                "attributeValues": [{
                    "attribute": {
                        "id": "wFC6joy3I8Q",
                        "code": "isNewDataModel",
                    },
                    "value": "false"
                }]
            };

            var enrichedDataSet = {
                name: 'OPD',
                id: 'DS_OPD',
                organisationUnits: [{
                    id: 'mod1'
                }],
                attributeValues: [{
                    attribute: {
                        id: 'wFC6joy3I8Q',
                        code: 'isNewDataModel'
                    },
                    value: 'false'
                }],
                dataElements: [],
                sections: [{
                    id: 'Sec1',
                    dataSet: {
                        name: 'OPD',
                        id: 'DS_OPD'
                    },
                    isIncluded: true,
                    dataElements: [{
                        id: 'DE1',
                        name: 'DE1 - ITFC',
                        isIncluded: true,
                        formName: 'DE1'
                    }, {
                        id: 'DE2',
                        name: 'DE2 - ITFC',
                        isIncluded: true,
                        formName: 'DE2'
                    }, {
                        id: 'DE4',
                        name: 'DE4 - ITFC',
                        isIncluded: true,
                        formName: 'DE4'
                    }]
                }, {
                    id: 'Sec2',
                    dataSet: {
                        name: 'OPD',
                        id: 'DS_OPD'
                    },
                    isIncluded: true,
                    dataElements: [{
                        id: 'DE1',
                        name: 'DE1 - ITFC',
                        isIncluded: true,
                        formName: 'DE1'
                    }]
                }]
            };
            var db = {
                "objectStore": {}
            };
            var datasetStore = utils.getMockStore(q, dataSet, datasetsdata);

            spyOn(db, 'objectStore').and.callFake(function(storeName) {
                if (storeName === "dataSets")
                    return datasetStore;
                if (storeName === "sections")
                    return sectionStore;
                if (storeName === "dataElements")
                    return dataElementStore;
                return utils.getMockStore(q, '', testData.get(storeName));
            });

            mockStore.find.and.returnValue(utils.getPromise(q, dataSet));

            datasetRepository = new DatasetRepository(db, q);
            var result;
            datasetRepository.getEnriched('ds1').then(function(data) {
                result = data;
            });

            scope.$apply();
            expect(result).toEqual(enrichedDataSet);
        });
    });
});
