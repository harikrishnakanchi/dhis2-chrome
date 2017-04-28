define(["uploadExcludedDataElementsConsumer", "utils", "angularMocks", "dataStoreService", "excludedDataElementsRepository"],
    function(UploadExcludedDataElementsConsumer, utils, mocks, DataStoreService, ExcludedDataElementsRepository) {
        describe("uploadExcludedDataElementsConsumer", function() {
            var uploadExcludedDataElementsConsumer, dataStoreService, excludedDataElementsRepository, q, scope, mockMessage, localExcludedDataElements, http;

            beforeEach(mocks.inject(function($q, $rootScope, $http) {
                q = $q;
                scope = $rootScope.$new();
                http = $http;

                mockMessage = {
                    "data": {
                        "data": "mod1",
                        "type": "uploadExcludedDataElements"
                    }
                };

                localExcludedDataElements = {
                    "orgUnit": "mod1",
                    "dataElements": [{
                        "id": "de1"
                    }, {
                        "id": "de2"
                    }],
                    "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                };

                dataStoreService = new DataStoreService(http);
                spyOn(dataStoreService, "updateExcludedDataElements").and.returnValue(utils.getPromise(q, {}));
                spyOn(dataStoreService, "createExcludedDataElements").and.returnValue(utils.getPromise(q, {}));
                spyOn(dataStoreService, "getExcludedDataElements").and.returnValue(utils.getPromise(q, undefined));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, "upsert").and.returnValue(utils.getPromise(q, undefined));
                spyOn(excludedDataElementsRepository, "get").and.returnValue(utils.getPromise(q, localExcludedDataElements));

                uploadExcludedDataElementsConsumer = new UploadExcludedDataElementsConsumer(q, dataStoreService, excludedDataElementsRepository);
            }));

            it("should get excluded dataElements for specified module from dhis", function() {
                uploadExcludedDataElementsConsumer.run(mockMessage);
                scope.$apply();

                expect(dataStoreService.getExcludedDataElements).toHaveBeenCalledWith("mod1");
            });

            it('should get local excluded dataElements', function () {
                uploadExcludedDataElementsConsumer.run(mockMessage);
                scope.$apply();

                expect(excludedDataElementsRepository.get).toHaveBeenCalledWith("mod1");
            });

            it('should upload excluded dataElements to DHIS if remote data is not present', function () {
                dataStoreService.getExcludedDataElements.and.returnValue(utils.getPromise(q, undefined));
                uploadExcludedDataElementsConsumer.run(mockMessage);
                scope.$apply();

                expect(dataStoreService.createExcludedDataElements).toHaveBeenCalledWith('mod1', localExcludedDataElements);
            });

            it('should update the remote excluded dataElements if local data is latest', function () {
                var remoteExcludedDataElements = {
                    "orgUnit": "mod1",
                    "dataElements": [{
                        "id": "de1"
                    }],
                    "clientLastUpdated": "2014-05-29T12:43:54.972Z"
                };
                dataStoreService.getExcludedDataElements.and.returnValue(utils.getPromise(q, remoteExcludedDataElements));
                uploadExcludedDataElementsConsumer.run(mockMessage);
                scope.$apply();

                expect(dataStoreService.updateExcludedDataElements).toHaveBeenCalledWith('mod1', localExcludedDataElements);
            });

            it('should update the local excluded dataElements if remote data is latest', function () {
                var remoteExcludedDataElements = {
                    "orgUnit": "mod1",
                    "dataElements": [{
                        "id": "de1"
                    }],
                    "clientLastUpdated": "2014-05-30T12:46:54.972Z"
                };
                dataStoreService.getExcludedDataElements.and.returnValue(utils.getPromise(q, remoteExcludedDataElements));
                uploadExcludedDataElementsConsumer.run(mockMessage);
                scope.$apply();

                expect(excludedDataElementsRepository.upsert).toHaveBeenCalledWith(remoteExcludedDataElements);
            });
        });
    });
