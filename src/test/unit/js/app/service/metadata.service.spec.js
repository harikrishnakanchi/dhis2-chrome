define(["metadataService", "properties", "utils", "angularMocks"], function(MetadataService, properties, utils) {
    describe("Metadata service", function() {
        var httpBackend, http, db, q, mockStore, category1, data, systemSettings, translations, dataSets;
        var today = "2014-03-24T09:02:49.870Z";
        var yesterday = "2014-03-23T09:02:49.870Z";
        var tomorrow = "2014-03-25T09:02:49.870Z";

        beforeEach(inject(function($injector, $q) {
            q = $q;
            category1 = {
                id: "blah"
            };
            db = {
                objectStore: function() {}
            };
            mockStore = {
                upsert: function() {
                    return utils.getPromise(q, {});
                },
                find: function() {
                    return utils.getPromise(q, undefined);
                }
            };

            data = {
                "categories": [category1],
                "created": tomorrow
            };
            systemSettings = {
                "proj_0": "{\"excludedDataElements\": {\"module1\": [\"DE1\", \"DE2\"]}}"
            };
            translations = {
                "translations": [{
                    "id": "blah",
                    "locale": "es"
                }]
            };

            dataSets = {
                "dataSets": [{
                    "id": "DS_Physio",
                    "organisationUnits": [{
                        "name": "Mod1",
                        "id": "hvybNW8qEov"
                    }]
                }]
            };

            spyOn(db, 'objectStore').and.returnValue(mockStore);
            spyOn(mockStore, 'upsert').and.returnValue(utils.getPromise(q, {
                lastUpdatedTime: today
            }));

            httpBackend = $injector.get('$httpBackend');
            http = $injector.get('$http');
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        var setupLocalFileHttpRequest = function(lastUpdatedTime) {
            httpBackend.expectGET("/data/metadata.json", {
                "Accept": "application/json, text/plain, */*"
            }).respond(200, {
                categories: [category1],
                created: lastUpdatedTime
            });
        };

        it("should fetch all metadata from file the first time", function() {
            var findCall = 0;
            setupLocalFileHttpRequest(today);
            httpBackend.expectGET("/data/organisationUnits.json").respond(200, {});
            httpBackend.expectGET("/data/organisationUnitGroups.json").respond(200, {});
            httpBackend.expectGET("/data/systemSettings.json").respond(200, {});
            httpBackend.expectGET("/data/translations.json").respond(200, {});
            httpBackend.expectGET("/data/programs.json").respond(200, {});

            var metadataService = new MetadataService(http, db, q);
            metadataService.loadMetadataFromFile();

            httpBackend.flush();

            expect(mockStore.upsert).toHaveBeenCalledWith([category1]);
            expect(mockStore.upsert).toHaveBeenCalledWith({
                type: 'metaData',
                lastUpdatedTime: today
            });
            expect(mockStore.upsert.calls.count()).toEqual(6);
        });

        it("should trasform and sync program data", function() {
            var headers = {
                "Accept": "application/json, text/plain, */*"
            };
            setupLocalFileHttpRequest(today);

            var data = {
                "programs": [{
                    "id": "p1",
                    "organisationUnits": [{
                        "id": "1",
                        "name": "o1"
                    }, {
                        "id": "2",
                        "name": "o2"
                    }]
                }, {
                    "id": "p2"
                }],
                "created": tomorrow
            };

            httpBackend.expectGET("/data/organisationUnits.json").respond(200, {});
            httpBackend.expectGET("/data/organisationUnitGroups.json").respond(200, {});
            httpBackend.expectGET("/data/systemSettings.json", headers).respond(200, {});
            httpBackend.expectGET("/data/translations.json", headers).respond(200, {});
            httpBackend.expectGET("/data/programs.json").respond(200, data);


            var metadataService = new MetadataService(http, db, q);
            metadataService.loadMetadataFromFile();

            httpBackend.flush();

            expect(mockStore.upsert).toHaveBeenCalledWith([{
                "id": "p1",
                "orgUnitIds": ["1", "2"],
                "organisationUnits": [{
                    "id": "1",
                    "name": "o1"
                }, {
                    "id": "2",
                    "name": "o2"
                }]
            }, {
                "id": "p2"
            }]);
        });

        it("should not upsert metaData if import has already happened one time", function() {
            setupLocalFileHttpRequest(today);

            spyOn(mockStore, "find").and.returnValue(utils.getPromise(q, {
                lastUpdatedTime: tomorrow
            }));
            var metadataService = new MetadataService(http, db, q);

            metadataService.loadMetadataFromFile();
            httpBackend.flush();

            expect(mockStore.upsert.calls.count()).toEqual(0);
        });

        it("should sync metadata and update changelog", function() {
            var headers = {
                "Accept": "application/json, text/plain, */*"
            };
            httpBackend.expectGET(properties.dhis.url + "/api/metadata?lastUpdated=2014-03-24T09:02:49.870Z").respond(200, data);
            httpBackend.expectGET(properties.dhis.url + "/api/dataSets.json?paging=false&fields=[:all]").respond(200, dataSets);
            httpBackend.expectGET(properties.dhis.url + "/api/systemSettings", headers).respond(200, systemSettings);
            httpBackend.expectGET(properties.dhis.url + "/api/translations", headers).respond(200, translations);

            spyOn(mockStore, "find").and.returnValue(utils.getPromise(q, {
                "lastUpdatedTime": today
            }));

            var metadataService = new MetadataService(http, db, q);
            metadataService.sync();

            httpBackend.flush();

            expect(mockStore.upsert).toHaveBeenCalledWith([category1]);
            expect(mockStore.upsert).toHaveBeenCalledWith({
                type: 'metaData',
                lastUpdatedTime: tomorrow
            });
            expect(mockStore.upsert).toHaveBeenCalledWith([{
                "key": 'proj_0',
                "value": {
                    excludedDataElements: {
                        module1: ['DE1', 'DE2']
                    }
                }
            }]);
            expect(mockStore.upsert).toHaveBeenCalledWith([{
                id: 'blah',
                locale: 'es'
            }]);
        });

        it("should pull all metadata if syncing for the first time", function() {
            var headers = {
                "Accept": "application/json, text/plain, */*"
            };
            httpBackend.expectGET(properties.dhis.url + "/api/metadata").respond(200, data);
            httpBackend.expectGET(properties.dhis.url + "/api/dataSets.json?paging=false&fields=[:all]").respond(200, dataSets);
            httpBackend.expectGET(properties.dhis.url + "/api/systemSettings", headers).respond(200, systemSettings);
            httpBackend.expectGET(properties.dhis.url + "/api/translations", headers).respond(200, translations);

            var metadataService = new MetadataService(http, db, q);
            metadataService.sync();

            httpBackend.flush();

            expect(mockStore.upsert).toHaveBeenCalledWith([category1]);
            expect(mockStore.upsert).toHaveBeenCalledWith({
                type: 'metaData',
                lastUpdatedTime: tomorrow
            });
            expect(mockStore.upsert).toHaveBeenCalledWith([{
                "key": 'proj_0',
                "value": {
                    excludedDataElements: {
                        module1: ['DE1', 'DE2']
                    }
                }
            }]);
            expect(mockStore.upsert).toHaveBeenCalledWith([{
                id: 'blah',
                locale: 'es'
            }]);
        });
    });
});
