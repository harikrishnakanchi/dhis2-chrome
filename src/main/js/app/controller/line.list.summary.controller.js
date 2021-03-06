define(["lodash", "moment", "properties", "dateUtils", "orgUnitMapper", "interpolate", "excelBuilder", "dataElementUtils", "customAttributes"], function(_, moment, properties, dateUtils, orgUnitMapper, interpolate, excelBuilder, dataElementUtils, customAttributes) {
    return function($scope, $rootScope, $q, $hustle, $modal, $window, $timeout, $location, $anchorScroll, $routeParams, historyService, programRepository, programEventRepository, excludedDataElementsRepository,
        orgUnitRepository, approvalDataRepository, dataSyncFailureRepository, translationsService, filesystemService, optionSetRepository) {

        $scope.filterParams = {};
        $scope.showOfflineSummaryForViewOnly = true;
        $scope.viewRegistrationBook = false;
        $scope.excludedDataElementIds = [];

        var INITIAL_PAGE_LIMIT = 20;
        var indexedOptionSets = {};
        $scope.pageLimit = INITIAL_PAGE_LIMIT;

        $scope.loadMoreEvents = function () {
            $scope.pageLimit += 10;
        };

        var scrollReachedBottomOfPage = function () {
            if (($window.innerHeight + $window.scrollY) >= document.body.scrollHeight - 200 /* 200px buffer space above the bottom of the window */) {
                $scope.$apply($scope.loadMoreEvents);
            }
        };

        $window.addEventListener('scroll', scrollReachedBottomOfPage);

        $scope.$on('$destroy', function () {
            $window.removeEventListener('scroll', scrollReachedBottomOfPage);
        });

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var confirmAndProceed = function(okCallback, message, showModal) {
            if (showModal === false)
                return $q.when(okCallback());

            $scope.modalMessages = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            return modalInstance.result
                .then(function() {
                    return okCallback();
                }, function() {
                    //burp on cancel
                });
        };

        var showResultMessage = function(messageType, message) {
            var hideMessage = function() {
                $scope.resultMessageType = "";
                $scope.resultMessage = "";
            };

            $scope.resultMessageType = messageType;
            $scope.resultMessage = message;
            $timeout(hideMessage, properties.messageTimeout);
            scrollToTop();
        };

        var enhanceEvents = function (events) {

            var minEventDate = dateUtils.max([dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSync), $scope.moduleOpeningDate]).startOf('day').toISOString();

            var addHistoricalEventFlag = function (event) {
                event.isHistorical = (moment(new Date(event.eventDate)).isBefore(minEventDate));
                return event;
            };

            $scope.events = _.chain(translationsService.translate(events)).map(addHistoricalEventFlag).value();

            //reset pageLimit
            $scope.pageLimit = INITIAL_PAGE_LIMIT;
        };

        var loadEventsView = function() {
            $scope.eventForm = {
                allEvents: []
            };

            if ($scope.filterParams.filterBy === "incomplete") {
                $scope.eventListTitle = $scope.resourceBundle.incompleteEventsTitle;
                $scope.noCasesMsg = $scope.resourceBundle.noIncompleteEventsFound;

                return programEventRepository.getDraftEventsFor($scope.program.id, $scope.orgUnitIdAssociatedToProgram)
                    .then(enhanceEvents);
            }
            if ($scope.filterParams.filterBy === "readyToSubmit") {
                $scope.eventListTitle = $scope.resourceBundle.readyToSubmitEventsTitle;
                $scope.noCasesMsg = $scope.resourceBundle.noReadyToSubmitEventsFound;
                return programEventRepository.getSubmitableEventsFor($scope.program.id, $scope.orgUnitIdAssociatedToProgram).then(function(events) {
                    return _.filter(events, function(event) {
                        var eventIsADraft = event.localStatus === "NEW_DRAFT" || event.localStatus === "UPDATED_DRAFT",
                            eventIsSubmittedButHasNoTimestamp = event.localStatus === "READY_FOR_DHIS" && _.isUndefined(event.clientLastUpdated),
                            eventIsSubmittedButHasNotSynced = event.localStatus === "READY_FOR_DHIS" && !_.isUndefined(event.clientLastUpdated) &&
                                                              moment().diff(moment(event.clientLastUpdated), 'days') > properties.eventsSync.numberOfDaysToAllowResubmit;
                        return eventIsADraft || eventIsSubmittedButHasNoTimestamp || eventIsSubmittedButHasNotSynced;
                    });
                }).then(enhanceEvents);
            }
            if ($scope.filterParams.filterBy === "dateRange") {
                var startDate = $location.search().startDate;
                var endDate = $location.search().endDate;
                $scope.filterParams.startDate = $scope.filterParams.startDate || moment(startDate).startOf('day').toDate();
                $scope.filterParams.endDate = $scope.filterParams.endDate || moment(endDate).endOf('day').toDate();

                $scope.filterByDateRange();
            }

            if ($scope.filterParams.filterBy === "caseNumber") {
                $scope.filterParams.caseNumber = $scope.filterParams.caseNumber || $location.search().caseNumber;
                $scope.filterByCaseNumber();
            }

        };

        $scope.$watchGroup(['filterParams.startDate', 'filterParams.endDate'], function (newValues) {
            var startDate = newValues[0],
                endDate = newValues[1];
            $scope.dateRangeError = startDate > endDate;
        });

        var getSubmitableEvents = function() {
            return _.filter($scope.events, function(event) {
                return event.localStatus === "NEW_DRAFT" || event.localStatus === "UPDATED_DRAFT";
            });
        };

        $scope.back = function() {
            $scope.viewRegistrationBook = false;
        };

        $scope.printWindow = function() {
            $timeout(function() {
                $window.print();
            }, 0);
        };

        $scope.showRegistrationBook = function() {
            $scope.viewRegistrationBook = true;
        };

        $scope.showPatientOriginInSummaryTable = function() {
            return $scope.program.name === "Cholera Treatment Centre";
        };

        $scope.getDisplayValue = function(dataValue) {
            var dataValueType = dataValue && dataValue.valueType;

            if (!dataValue.value) return "";

            if (dataValue.optionSet) {
                var optionSetId = dataValue.optionSet.id;
                var optionSet = indexedOptionSets[optionSetId] || {};
                var option = _.find(optionSet.options, function(o) {
                    return o.code === dataValue.value;
                });
                return option ? option.name : "";
            }
            if (dataValueType === 'DATE') {
                return $scope.getFormattedDate(dataValue.value);
            }

            if (dataValueType === 'BOOLEAN') {
                return dataValue.value === 'true' ? $scope.resourceBundle.yesLabel : $scope.resourceBundle.noLabel;
            }
            else {
                return dataValue.value;
            }
        };

        $scope.getFormattedDate = function(date) {
            return date ? moment(date).toDate().toLocaleDateString() : "";
        };

        var getPeriodsAndOrgUnits = function(periods) {
            return _.map(periods, function(period) {
                return {
                    period: period,
                    orgUnit: $scope.selectedModuleId
                };
            });
        };

        var publishMessageToSyncModuleDataBlock = function (period) {
            return $hustle.publishOnce({
                type: 'syncModuleDataBlock',
                data: {
                    moduleId: $scope.selectedModuleId,
                    period: period
                },
                locale: $scope.locale,
                desc: interpolate($scope.resourceBundle.syncModuleDataBlockDesc, {
                    period: period + ', ' + $scope.selectedModuleName
                })
            }, 'dataValues');
        };

        $scope.submit = function() {
            var submitableEvents = $scope.events,
                submitablePeriods = _.uniq(_.map(submitableEvents, 'period')),
                periodsAndOrgUnits = getPeriodsAndOrgUnits(submitablePeriods);

            var clearAnyExisingApprovals = function() {
                return approvalDataRepository.clearApprovals(periodsAndOrgUnits);
            };

            var clearFailedToSync = function () {
              return _.each(submitablePeriods, function (period) {
                  dataSyncFailureRepository.delete($scope.selectedModuleId, period);
              });
            };

            var publishToDhis = function() {
                var publishPromises = _.map(submitablePeriods, publishMessageToSyncModuleDataBlock);
                return $q.all(publishPromises);
            };

            var updateView = function() {
                showResultMessage("success", interpolate($scope.resourceBundle.eventSubmitSuccess, { number_of_events: submitableEvents.length }));
                loadEventsView();
            };

            programEventRepository.markEventsAsSubmitted(_.pluck(submitableEvents, 'event'))
                .then(clearAnyExisingApprovals)
                .then(clearFailedToSync)
                .then(publishToDhis)
                .then(updateView);
        };

        $scope.submitAndApprove = function() {
            var submitableEvents = getSubmitableEvents(),
                submittablePeriods = _.uniq(_.pluck(submitableEvents, 'period')),
                periodsAndOrgUnits = getPeriodsAndOrgUnits(submittablePeriods);

            var clearAnyExisingApprovals = function() {
                return approvalDataRepository.clearApprovals(periodsAndOrgUnits);
            };

            var clearFailedToSync = function () {
                return _.each(submittablePeriods, function (period) {
                    dataSyncFailureRepository.delete($scope.selectedModuleId, period);
                });
            };

            var markAsApproved = function() {
                var completedAndApprovedBy = $scope.currentUser.userCredentials.username;
                return approvalDataRepository.markAsApproved(periodsAndOrgUnits, completedAndApprovedBy);
            };

            var publishToDhis = function() {
                var publishPromises = _.map(submittablePeriods, publishMessageToSyncModuleDataBlock);
                return $q.all(publishPromises);
            };

            var updateView = function() {
                showResultMessage('success', interpolate($scope.resourceBundle.eventSubmitAndApproveSuccess, { number_of_events: submitableEvents.length }));
                loadEventsView();
            };

            programEventRepository.markEventsAsSubmitted(_.pluck(submitableEvents, 'event'))
                .then(clearAnyExisingApprovals)
                .then(clearFailedToSync)
                .then(markAsApproved)
                .then(publishToDhis)
                .then(updateView);
        };

        $scope.deleteEvent = function(event) {
            var hardDelete = function() {
                return programEventRepository.delete(event.event);
            };

            var softDelete = function() {
                var periodAndOrgUnit = {
                    period: event.period,
                    orgUnit: $scope.selectedModuleId
                };
                event.localStatus = 'DELETED';

                var clearFailedToSync = function () {
                    return dataSyncFailureRepository.delete($scope.selectedModuleId, periodAndOrgUnit.period);
                };

                return programEventRepository.upsert(event)
                    .then(_.partial(approvalDataRepository.clearApprovals, periodAndOrgUnit))
                    .then(clearFailedToSync)
                    .then(_.partial(publishMessageToSyncModuleDataBlock, event.period));
            };

            var deleteOnConfirm = function() {
                var deleteFunction = event.localStatus === 'NEW_DRAFT' || event.localStatus === 'NEW_INCOMPLETE_DRAFT' ? hardDelete : softDelete;
                return deleteFunction.apply().then(function() {
                    showResultMessage('success', $scope.resourceBundle.eventDeleteSuccess);
                    loadEventsView();
                });
            };

            confirmAndProceed(deleteOnConfirm, {
                "confirmationMessage": $scope.resourceBundle.deleteEventConfirmation
            });
        };

        $scope.filterByCaseNumber = function() {
            $scope.startLoading();
            programEventRepository.findEventsByCode($scope.program.id, $scope.orgUnitIdAssociatedToProgram, $scope.filterParams.caseNumber)
                .then(enhanceEvents)
                .then($scope.stopLoading);
        };

        $scope.filterByDateRange = function() {
            $scope.startLoading();
            var startDate = moment($scope.filterParams.startDate).format("YYYY-MM-DD");
            var endDate = moment($scope.filterParams.endDate).format("YYYY-MM-DD");

            programEventRepository.findEventsByDateRange($scope.program.id, $scope.orgUnitIdAssociatedToProgram, startDate, endDate)
                .then(enhanceEvents)
                .then($scope.stopLoading);
        };

        $scope.filterSubmittedEvents = function (event) {
            return !event.localStatus || event.localStatus==='READY_FOR_DHIS';
        };

        $scope.exportToExcel = function () {

            var buildHeaders = function () {
                var formNames = _.map($scope.dataElementsForExport, dataElementUtils.getDisplayName);
                return formNames.concat($scope.resourceBundle.patientOriginLabel);
            };

            var buildData = function (event) {
                var dataValues = _.reject(event.dataValues, function (dataValue) {
                    return _.contains($scope.excludedDataElementIds, dataValue.dataElement);
                });

                var values = _.map(dataValues, $scope.getDisplayValue);
                return values.concat(event.orgUnitName);
            };

            var eventsToBeExported = _.chain($scope.events).filter($scope.filterSubmittedEvents).map(buildData).value();

            var workBookContent = [{
                name: $scope.selectedModuleName,
                data: [buildHeaders()].concat(eventsToBeExported)
            }];
            var fileName = [$scope.selectedModuleName, 'summary', moment().format('DD-MMM-YYYY')].join('.');
            return filesystemService.promptAndWriteFile(fileName, excelBuilder.createWorkBook(workBookContent), filesystemService.FILE_TYPE_OPTIONS.XLSX);
        };

        $scope.getOriginName = function(orgUnitId) {
            return _.find($scope.originOrgUnits, {
                "id": orgUnitId
            }).name;
        };

        $scope.getDisplayName = dataElementUtils.getDisplayName;

        $scope.$on('moduleWeekInfo', function(event, data) {
            $scope.errorMessage = undefined;
            $scope.selectedModule = data[0];
            $scope.week = data[1];
            init();
        });

        $scope.pushToHistory = function () {
            var currentSearchState = {
                filterBy : $scope.filterParams.filterBy,
                startDate: $scope.filterParams.startDate,
                endDate: $scope.filterParams.endDate,
                caseNumber: $scope.filterParams.caseNumber
            };
            historyService.pushState(currentSearchState);
        };

        $scope.$on('errorInfo', function(event, errorMessage) {
            $scope.errorMessage = errorMessage;
        });

        $scope.viewAllDataElements = function () {
            var scope = $rootScope.$new();

            scope.isOpen = {};
            scope.orgUnit = $scope.orgUnit;

            $modal.open({
                templateUrl: 'templates/view-all-linelist-data-elements.html',
                controller: 'lineListModuleController',
                scope: scope,
                windowClass: 'modal-lg'
            });
        };

        var init = function() {

            var loadModule = function() {
                return orgUnitRepository.get($routeParams.module).then(function(data) {
                    $scope.orgUnit = data;

                    $scope.selectedModuleId = data.id;
                    $scope.selectedModuleName = data.name;
                    $scope.opUnitId = data.parent.id;
                    $scope.moduleOpeningDate = data.openingDate;
                    $scope.moduleAndOpUnitName = data.parent.name + ' - ' + data.name;
                });
            };

            var loadOriginOrgUnits = function() {
                return orgUnitRepository.findAllByParent($scope.selectedModuleId).then(function(data) {
                    $scope.originOrgUnits = data;
                    $scope.orgUnitIdAssociatedToProgram = _.map($scope.originOrgUnits, 'id').concat($scope.selectedModuleId);
                });
            };

            var loadPrograms = function() {
                var getSummaryDataElementFromProgram = function (program) {
                    var sections = _.flatten(_.map(program.programStages, 'programStageSections')),
                        programStageDataElements = _.flatten(_.map(sections, 'programStageDataElements'));
                    return _.filter(_.map(programStageDataElements, 'dataElement'), 'showInEventSummary');
                };

                var getDataElementsForExport = function (program) {
                    var sections = _.flatten(_.map(program.programStages, 'programStageSections')),
                        programStageDataElements = _.flatten(_.map(sections, 'programStageDataElements'));
                    return _.reject(_.map(programStageDataElements, 'dataElement'), function (dataElement) {
                        return _.contains($scope.excludedDataElementIds, _.get(dataElement, 'id'));
                    });
                };

                var getExcludedDataElementsForModule = function() {
                    return excludedDataElementsRepository.get($scope.selectedModuleId).then(function(data) {
                        $scope.excludedDataElementIds = data ? _.pluck(data.dataElements, "id") : [];
                        return $scope.excludedDataElementIds;
                    });
                };

                var getProgram = function(excludedDataElements) {
                    var getProgramFromOrgUnit = function () {
                        return programRepository.getProgramForOrgUnit(_.first($scope.orgUnitIdAssociatedToProgram));
                    };

                    return getProgramFromOrgUnit().then(function(program) {
                        return programRepository.get(program.id, excludedDataElements).then(function(program) {
                            $scope.program = translationsService.translate(program);
                            $scope.summaryDataElements = getSummaryDataElementFromProgram($scope.program);
                            $scope.dataElementsForExport = getDataElementsForExport($scope.program);
                        });
                    });
                };

                return getExcludedDataElementsForModule().then(getProgram);
            };

            var loadOptionSets = function () {
                var translateOptionSets = function (optionSets) {
                    var partitionedDataset = _.partition(optionSets, 'isReferralLocationOptionSet');
                    var translatedOptionSets = translationsService.translate(partitionedDataset[1]);
                    return translatedOptionSets.concat(partitionedDataset[0]);
                };

                var getOptionSets = function () {
                    return optionSetRepository.getOptionSets($scope.opUnitId, $scope.selectedModuleId);
                };

                var setOptionSets = function (optionSets) {
                    indexedOptionSets = _.indexBy(optionSets, 'id');
                };

                return getOptionSets()
                    .then(translateOptionSets)
                    .then(setOptionSets);
            };

            var setUpProjectAutoApprovedFlag = function() {
                return orgUnitRepository.getParentProject($scope.selectedModuleId).then(function(orgUnit) {
                    $scope.projectIsAutoApproved = customAttributes.getBooleanAttributeValue(orgUnit.attributeValues, customAttributes.AUTO_APPROVE);
                });
            };

            showResultMessage($location.search().messageType, $location.search().message);

            $scope.filterParams.filterBy = $routeParams.filterBy;
            if (!$scope.filterParams.filterBy)
                $scope.filterParams.filterBy = 'caseNumber';
            $scope.eventListTitle = $scope.resourceBundle.eventListTitle;
            $scope.noCasesMsg = $scope.resourceBundle.noCasesFound;
            $scope.startLoading();
            return loadModule()
                .then(loadOriginOrgUnits)
                .then(loadPrograms)
                .then(loadOptionSets)
                .then(setUpProjectAutoApprovedFlag)
                .then(loadEventsView)
                .finally($scope.stopLoading);
        };

        init();
    };
});
