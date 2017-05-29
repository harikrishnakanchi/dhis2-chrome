define(["dispatcher", "angularMocks", "utils"], function(Dispatcher, mocks, utils) {
    describe("dispatcher", function() {
        var dispatcher, message, q, log, scope,
            createUserConsumer, updateUserConsumer, uploadProgramConsumer, downloadProgramConsumer,
            downloadMetadataConsumer, downloadDataSetConsumer, updateDataSetConsumer, associateOrgunitToProgramConsumer,
            downloadSystemSettingConsumer, uploadPatientOriginConsumer, uploadExcludedDataElementsConsumer, downloadPivotTableDataConsumer, downloadChartDataConsumer, downloadEventReportDataConsumer,
            uploadReferralLocationsConsumer, downloadProjectSettingsConsumer, downloadChartsConsumer, downloadPivotTablesConsumer, downloadEventReportsConsumer,
            uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadOrgUnitConsumer, downloadOrgUnitGroupConsumer, userPreferenceRepository, downloadModuleDataBlocksConsumer,
            syncModuleDataBlockConsumer, syncExcludedLinelistOptionsConsumer, downloadHistoricalDataConsumer, syncOrgUnitConsumer;

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
            downloadEventReportDataConsumer = {
                'run': jasmine.createSpy("downloadEventReportDataConsumer")
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
            downloadEventReportsConsumer = {
                'run': jasmine.createSpy("downloadEventReportsConsumer")
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
            syncExcludedLinelistOptionsConsumer = {
                'run': jasmine.createSpy("syncExcludedLinelistOptionsConsumer")
            };
            downloadHistoricalDataConsumer = {
                'run': jasmine.createSpy("downloadHistoricalDataConsumer")
            };
            syncOrgUnitConsumer = {
                'run': jasmine.createSpy("syncOrgUnitConsumer")
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
            downloadEventReportDataConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadProjectSettingsConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadChartsConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadPivotTablesConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadEventReportsConsumer.run.and.returnValue(utils.getPromise(q, {}));
            userPreferenceRepository.getCurrentUsersUsername.and.returnValue(utils.getPromise(q, 'someUsername'));
            downloadModuleDataBlocksConsumer.run.and.returnValue(utils.getPromise(q, {}));
            syncModuleDataBlockConsumer.run.and.returnValue(utils.getPromise(q, {}));
            syncExcludedLinelistOptionsConsumer.run.and.returnValue(utils.getPromise(q, {}));
            downloadHistoricalDataConsumer.run.and.returnValue(utils.getPromise(q, {}));
            syncOrgUnitConsumer.run.and.returnValue(utils.getPromise(q, {}));

            dispatcher = new Dispatcher(q, log, downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDataSetConsumer, updateDataSetConsumer,
                createUserConsumer, updateUserConsumer, uploadProgramConsumer,
                downloadProgramConsumer, downloadMetadataConsumer,
                downloadOrgUnitGroupConsumer, downloadSystemSettingConsumer, uploadPatientOriginConsumer, downloadPivotTableDataConsumer, downloadChartDataConsumer, downloadEventReportDataConsumer,
                uploadReferralLocationsConsumer, downloadProjectSettingsConsumer, uploadExcludedDataElementsConsumer, downloadChartsConsumer, downloadPivotTablesConsumer, downloadEventReportsConsumer, userPreferenceRepository,
                downloadModuleDataBlocksConsumer, syncModuleDataBlockConsumer, associateOrgunitToProgramConsumer, syncExcludedLinelistOptionsConsumer, downloadHistoricalDataConsumer, syncOrgUnitConsumer);
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
                expect(downloadEventReportsConsumer.run).toHaveBeenCalledWith(message, {});
                expect(downloadEventReportDataConsumer.run).toHaveBeenCalledWith(message, {});
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

        describe('downloadModuleDataForProject', function () {
            beforeEach(function () {
                message.data = {
                    'data': {},
                    'type': 'downloadModuleDataForProject'
                };
            });

            it('should call download module data block consumer for non-admin user', function () {
                dispatcher.run(message);
                scope.$apply();

                expect(downloadProjectSettingsConsumer.run).toHaveBeenCalled();
                expect(downloadModuleDataBlocksConsumer.run).toHaveBeenCalled();
            });

            it('should not call download module data block consumer for admin user', function () {
                userPreferenceRepository.getCurrentUsersUsername.and.returnValue(utils.getPromise(q, 'superadmin'));
                dispatcher.run(message);
                scope.$apply();

                expect(downloadProjectSettingsConsumer.run).toHaveBeenCalled();
                expect(downloadModuleDataBlocksConsumer.run).not.toHaveBeenCalled();
            });
        });

        describe('downloadReportDefinitions', function () {
            beforeEach(function () {
                message.data = {
                    'data': {},
                    'type': 'downloadReportDefinitions'
                };
            });

            it('should call download pivot table consumer and download chart consumer for non-admin user', function () {
                dispatcher.run(message);
                scope.$apply();

                expect(downloadChartsConsumer.run).toHaveBeenCalled();
                expect(downloadPivotTablesConsumer.run).toHaveBeenCalled();
                expect(downloadEventReportsConsumer.run).toHaveBeenCalled();
            });

            it('should not call download pivot table consumer and download chart consumer for admin user', function () {
                userPreferenceRepository.getCurrentUsersUsername.and.returnValue(utils.getPromise(q, 'superadmin'));
                dispatcher.run(message);
                scope.$apply();

                expect(downloadChartsConsumer.run).not.toHaveBeenCalled();
                expect(downloadPivotTablesConsumer.run).not.toHaveBeenCalled();
                expect(downloadEventReportsConsumer.run).not.toHaveBeenCalled();
            });
        });

        describe('downloadReportData', function () {
            beforeEach(function () {
                message.data = {
                    'data': {},
                    'type': 'downloadReportData'
                };
            });

            it('should call download pivot table data consumer and download chart data consumer for non-admin user', function () {
                dispatcher.run(message);
                scope.$apply();

                expect(downloadChartDataConsumer.run).toHaveBeenCalled();
                expect(downloadPivotTableDataConsumer.run).toHaveBeenCalled();
                expect(downloadEventReportDataConsumer.run).toHaveBeenCalled();
            });

            it('should not call download pivot table data consumer and download chart data consumer for admin user', function () {
                userPreferenceRepository.getCurrentUsersUsername.and.returnValue(utils.getPromise(q, 'superadmin'));
                dispatcher.run(message);
                scope.$apply();

                expect(downloadChartDataConsumer.run).not.toHaveBeenCalled();
                expect(downloadPivotTableDataConsumer.run).not.toHaveBeenCalled();
                expect(downloadEventReportDataConsumer.run).not.toHaveBeenCalled();
            });
        });

        describe('downloadHistoricalData', function () {
            beforeEach(function () {
                message.data = {
                    'data': {},
                    'type': 'downloadHistoricalData'
                };
            });

            it('should call download historical data consumer for non-admin user', function () {
                dispatcher.run(message);
                scope.$apply();

                expect(downloadHistoricalDataConsumer.run).toHaveBeenCalled();
            });

            it('should not call historical data consumer for admin user', function () {
                userPreferenceRepository.getCurrentUsersUsername.and.returnValue(utils.getPromise(q, 'superadmin'));
                dispatcher.run(message);
                scope.$apply();

                expect(downloadHistoricalDataConsumer.run).not.toHaveBeenCalled();
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

        it("should call associate org unit to program", function() {
            message.data = {
                "data": {},
                "type": "associateOrgunitToProgram"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(associateOrgunitToProgramConsumer.run).toHaveBeenCalledWith(message);
        });


        it("should call sync org unit consumer", function() {
            message.data = {
                "data": {},
                "type": "syncOrgUnit"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(syncOrgUnitConsumer.run).toHaveBeenCalledWith(message);
        });
    });
});