define(["dispatcher", "angularMocks", "utils"], function(Dispatcher, mocks, utils) {
    describe("dispatcher", function() {
        var dispatcher, message, q, log, scope, hustleMonitor,
            createUserConsumer, updateUserConsumer, uploadProgramConsumer, downloadProgramConsumer,
            downloadMetadataConsumer, downloadDataSetConsumer, updateDataSetConsumer, associateOrgunitToProgramConsumer,
            downloadSystemSettingConsumer, uploadPatientOriginConsumer, uploadExcludedDataElementsConsumer, downloadPivotTableDataConsumer, downloadChartDataConsumer,
            uploadReferralLocationsConsumer, downloadProjectSettingsConsumer, downloadChartsConsumer, downloadPivotTablesConsumer,
            uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadOrgUnitConsumer, downloadOrgUnitGroupConsumer, userPreferenceRepository, downloadModuleDataBlocksConsumer,
            syncModuleDataBlockConsumer, removeOrgunitDataSetAssociationConsumer, syncExcludedLinelistOptionsConsumer, downloadHistoricalDataConsumer;

        beforeEach(mocks.inject(function($q, $log, $rootScope) {
            downloadOrgUnitConsumer = {
                'run': jasmine.createSpy("downloadOrgUnitConsumer")
            };
            uploadOrgUnitConsumer = {
                'run': jasmine.createSpy("uploadOrgUnitConsumer")
            };
            uploadOrgUnitGroupConsumer = {
                'run': jasmine.createSpy("uploadOrgUnitGroupConsumer")
            };
            downloadOrgUnitGroupConsumer = {
                'run': jasmine.createSpy("downloadOrgUnitGroupConsumer")
            };
            downloadDataSetConsumer = {
                'run': jasmine.createSpy("downloadDataSetConsumer")
            };
            updateDataSetConsumer = {
                'run': jasmine.createSpy("updateDataSetConsumer")
            };
            associateOrgunitToProgramConsumer ={
                'run': jasmine.createSpy("associateOrgunitToProgramConsumer")
            };
            createUserConsumer = {
                'run': jasmine.createSpy("createUserConsumer")
            };
            updateUserConsumer = {
                'run': jasmine.createSpy("updateUserConsumer")
            };
            downloadProgramConsumer = {
                'run': jasmine.createSpy("downloadProgramConsumer")
            };
            uploadProgramConsumer = {
                'run': jasmine.createSpy("uploadProgramConsumer")
            };
            downloadMetadataConsumer = {
                'run': jasmine.createSpy("downloadMetadataConsumer")
            };
            downloadSystemSettingConsumer = {
                'run': jasmine.createSpy("downloadSystemSettingConsumer")
            };
            uploadPatientOriginConsumer = {
                'run': jasmine.createSpy("uploadPatientOriginConsumer")
            };
            downloadPivotTableDataConsumer = {
                'run': jasmine.createSpy("downloadPivotTableDataConsumer")
            };
            downloadChartDataConsumer = {
                'run': jasmine.createSpy("downloadChartDataConsumer")
            };
            uploadReferralLocationsConsumer = {
                'run': jasmine.createSpy("uploadReferralLocationsConsumer")
            };
            uploadExcludedDataElementsConsumer = {
                'run': jasmine.createSpy("uploadExcludedDataElementsConsumer")
            };
            downloadProjectSettingsConsumer = {
                'run': jasmine.createSpy("downloadProjectSettingsConsumer")
            };
            downloadChartsConsumer = {
                'run': jasmine.createSpy("downloadChartsConsumer")
            };
            downloadPivotTablesConsumer = {
                'run': jasmine.createSpy("downloadPivotTablesConsumer")
            };
            userPreferenceRepository = {
                'getCurrentUsersUsername': jasmine.createSpy("userPreferenceRepository")
            };
            downloadModuleDataBlocksConsumer = {
                'run': jasmine.createSpy("downloadModuleDataBlocksConsumer")
            };
            syncModuleDataBlockConsumer = {
                'run': jasmine.createSpy("syncModuleDataBlockConsumer")
            };
            removeOrgunitDataSetAssociationConsumer = {
                'run': jasmine.createSpy("removeOrgunitDataSetAssociationConsumer")
            };
            syncExcludedLinelistOptionsConsumer = {
                'run': jasmine.createSpy("syncExcludedLinelistOptionsConsumer")
            };
            downloadHistoricalDataConsumer = {
                'run': jasmine.createSpy("downloadHistoricalDataConsumer")
            };

            hustleMonitor = {
                checkHustleQueueCount: jasmine.createSpy('checkHustleQueueCount')
            };

            message = {};
            q = $q;
            log = $log;
            scope = $rootScope.$new();

            downloadMetadataConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadOrgUnitConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadOrgUnitGroupConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadProgramConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadDataSetConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadSystemSettingConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadPivotTableDataConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadChartDataConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadProjectSettingsConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadChartsConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadPivotTablesConsumer.run.and.returnValue(utils.getPromise(q, {}));
            userPreferenceRepository.getCurrentUsersUsername.and.returnValue(utils.getPromise(q, 'someUsername'));
            downloadModuleDataBlocksConsumer.run.and.returnValue(utils.getPromise(q, {}));
            syncModuleDataBlockConsumer.run.and.returnValue(utils.getPromise(q, {}));
            removeOrgunitDataSetAssociationConsumer.run.and.returnValue(utils.getPromise(q, {}));
            syncExcludedLinelistOptionsConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadHistoricalDataConsumer.run.and.returnValue(utils.getPromise(q, {}));

            dispatcher = new Dispatcher(q, log, downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDataSetConsumer, updateDataSetConsumer,
                createUserConsumer, updateUserConsumer, uploadProgramConsumer,
                downloadProgramConsumer, downloadMetadataConsumer,
                downloadOrgUnitGroupConsumer, downloadSystemSettingConsumer, uploadPatientOriginConsumer, downloadPivotTableDataConsumer, downloadChartDataConsumer,
                uploadReferralLocationsConsumer, downloadProjectSettingsConsumer, uploadExcludedDataElementsConsumer, downloadChartsConsumer, downloadPivotTablesConsumer, userPreferenceRepository,
                downloadModuleDataBlocksConsumer, syncModuleDataBlockConsumer, removeOrgunitDataSetAssociationConsumer, associateOrgunitToProgramConsumer, syncExcludedLinelistOptionsConsumer, downloadHistoricalDataConsumer, hustleMonitor);
        }));

        it("should call syncModuleDataBlock consumer for syncing moduleDataBlock", function() {
            message.data = {
                "data": {},
                "type": "syncModuleDataBlock"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(syncModuleDataBlockConsumer.run).toHaveBeenCalledWith(message);
        });

        describe('downloadProjectData job', function() {
            var message = {
                'data': {
                    'data': {},
                    'type': 'downloadProjectData'
                }
            };

            it("should call all project-data-related download consumers", function() {
                dispatcher.run(message);
                scope.$apply();

                expect(downloadProjectSettingsConsumer.run).toHaveBeenCalledWith(message);
                expect(downloadModuleDataBlocksConsumer.run).toHaveBeenCalled();
                expect(downloadChartsConsumer.run).toHaveBeenCalledWith(message, {});
                expect(downloadPivotTableDataConsumer.run).toHaveBeenCalledWith(message, {});
                expect(downloadChartDataConsumer.run).toHaveBeenCalledWith(message, {});
                expect(downloadPivotTablesConsumer.run).toHaveBeenCalledWith(message, {});
                expect(downloadHistoricalDataConsumer.run).toHaveBeenCalledWith(message, {});
            });

            it('should only call project settings download consumer if current user is an admin', function() {
                userPreferenceRepository.getCurrentUsersUsername.and.returnValue(utils.getPromise(q, 'projectadmin'));

                dispatcher.run(message);
                scope.$apply();

                expect(downloadProjectSettingsConsumer.run).toHaveBeenCalledWith(message);
            });

            it('should only call project settings download consumer if no user has ever logged in', function() {
                userPreferenceRepository.getCurrentUsersUsername.and.returnValue(utils.getPromise(q, null));

                dispatcher.run(message);
                scope.$apply();

                expect(downloadProjectSettingsConsumer.run).toHaveBeenCalledWith(message);
            });

        });

        it("should call upload org units consumer", function() {
            message.data = {
                "data": {},
                "type": "upsertOrgUnit"
            };
            dispatcher.run(message);
            scope.$apply();

            expect(downloadOrgUnitConsumer.run).toHaveBeenCalledWith(message);
            expect(uploadOrgUnitConsumer.run).toHaveBeenCalledWith(message, {});
        });

        it("should call download org units consumer", function() {
            message.data = {
                "data": [],
                "type": "downloadMetadata"
            };
            dispatcher.run(message);
            scope.$apply();
            expect(downloadOrgUnitConsumer.run).toHaveBeenCalledWith(message, jasmine.any(Object));
            expect(uploadOrgUnitConsumer.run).not.toHaveBeenCalled();
        });

        it("should call dataset consumer", function() {
            message.data = {
                "data": {},
                "type": "associateOrgUnitToDataset"
            };
            dispatcher.run(message);
            scope.$apply();
            expect(updateDataSetConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should fail if no hanlder found of payload type", function() {
            message.data = {
                "data": {},
                "type": "foo"
            };
            dispatcher.run(message).then(function() {
                expect(true).toBe(false);
            }, function() {
                expect(true).toBe(true);
            });
            scope.$apply();
        });

        it("should call create user consumer", function() {
            message.data = {
                "data": {},
                "type": "createUser"
            };
            dispatcher.run(message);
            expect(createUserConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call update user consumer", function() {
            message.data = {
                "data": {},
                "type": "updateUser"
            };
            dispatcher.run(message);
            expect(updateUserConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call upload program consumer", function() {
            message.data = {
                "data": {},
                "type": "uploadProgram"
            };
            dispatcher.run(message);
            scope.$apply();
            expect(downloadProgramConsumer.run).toHaveBeenCalledWith(message);
            expect(uploadProgramConsumer.run).toHaveBeenCalledWith(message, {});
        });

        it("should call download program consumer", function() {
            message.data = {
                "data": {},
                "type": "downloadMetadata"
            };
            dispatcher.run(message);
            scope.$apply();
            expect(downloadProgramConsumer.run).toHaveBeenCalledWith(message, jasmine.any(Object));
        });

        it("should call download metadata consumer", function() {
            message.data = {
                "data": {},
                "type": "downloadMetadata"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(downloadMetadataConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call uploadOrgUnitGroupConsumer", function() {
            message.data = {
                "data": {},
                "type": "upsertOrgUnitGroups"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(uploadOrgUnitGroupConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call downloadOrgUnitGroupConsumer", function() {
            message.data = {
                "data": {},
                "type": "downloadMetadata"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(downloadOrgUnitGroupConsumer.run).toHaveBeenCalledWith(message, jasmine.any(Object));
        });

        it("should download system setting consumer", function() {
            message.data = {
                "data": {},
                "type": "downloadMetadata"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(downloadSystemSettingConsumer.run).toHaveBeenCalledWith(message, jasmine.any(Object));
        });

        it("should upload patient origin consumer", function() {
            message.data = {
                "data": {},
                "type": "uploadPatientOriginDetails"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(uploadPatientOriginConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call upload referral locations", function() {
            message.data = {
                "data": {},
                "type": "uploadReferralLocations"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(uploadReferralLocationsConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call upload excluded data elements", function() {
            message.data = {
                "data": {},
                "type": "uploadExcludedDataElements"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(uploadExcludedDataElementsConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call upload excluded options", function() {
            message.data = {
                "data": {},
                "type": "uploadExcludedOptions"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(syncExcludedLinelistOptionsConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call remove org unit from dataset", function() {
            message.data = {
                "data": {},
                "type": "removeOrgUnitFromDataset"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(removeOrgunitDataSetAssociationConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call associate org unit to program", function() {
            message.data = {
                "data": {},
                "type": "associateOrgunitToProgram"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(associateOrgunitToProgramConsumer.run).toHaveBeenCalledWith(message);
        });
    });
});