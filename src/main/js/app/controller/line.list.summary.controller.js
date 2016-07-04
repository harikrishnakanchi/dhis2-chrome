define(["lodash", "moment", "properties", "orgUnitMapper"], function(_, moment, properties, orgUnitMapper) {
    return function($scope, $q, $hustle, $modal, $window, $timeout, $location, $anchorScroll, $routeParams, programRepository, programEventRepository, excludedDataElementsRepository,
        orgUnitRepository, approvalDataRepository, referralLocationsRepository, dataSyncFailureRepository, translationsService) {

        $scope.filterParams = {};
        $scope.currentUrl = $location.path();
        $scope.loadingResults = false;
        $scope.showOfflineSummaryForViewOnly = true;
        $scope.viewRegistrationBook = false;

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

        var loadEventsView = function() {
            $scope.eventForm = {
                allEvents: []
            };

            if ($scope.filterBy === "incomplete") {
                $scope.eventListTitle = $scope.resourceBundle.incompleteEventsTitle;
                $scope.noCasesMsg = $scope.resourceBundle.noIncompleteEventsFound;

                return programEventRepository.getDraftEventsFor($scope.program.id, _.pluck($scope.originOrgUnits, "id")).then(function(events) {
                    var translatedEvents = translationsService.translate(events);
                    $scope.events = translatedEvents;
                });
            }
            if ($scope.filterBy === "readyToSubmit") {
                var acc = [];
                $scope.eventListTitle = $scope.resourceBundle.readyToSubmitEventsTitle;
                $scope.noCasesMsg = $scope.resourceBundle.noReadyToSubmitEventsFound;
                return programEventRepository.getSubmitableEventsFor($scope.program.id, _.pluck($scope.originOrgUnits, "id")).then(function(data) {
                    _.each(data, function(event) {
                        if (event.localStatus === "NEW_DRAFT" || event.localStatus === "UPDATED_DRAFT")
                            acc.push(event);
                        if (event.localStatus === "READY_FOR_DHIS" && _.isUndefined(event.clientLastUpdated))
                            acc.push(event);
                        if (event.localStatus === "READY_FOR_DHIS" && !_.isUndefined(event.clientLastUpdated)) {
                            if ((moment().diff(moment(event.clientLastUpdated), 'days')) > properties.eventsSync.numberOfDaysToAllowResubmit)
                                acc.push(event);
                        }
                    });
                    var translatedEvents = translationsService.translate(acc);
                    $scope.events = translatedEvents;
                });
            }
            if ($scope.filterBy === "dateRange") {
                var startDate = $location.search().startDate;
                var endDate = $location.search().endDate;
                $scope.filterParams.startDate = moment(startDate).startOf('day').toDate();
                $scope.filterParams.endDate = moment(endDate).endOf('day').toDate();

                return programEventRepository.findEventsByDateRange($scope.program.id, _.pluck($scope.originOrgUnits, "id"), startDate, endDate).then(function(events) {
                    var translatedEvents = translationsService.translate(events);
                    $scope.events = translatedEvents;
                });
            }

            if ($scope.filterBy === "caseNumber") {
                $scope.filterParams.caseNumber = "";
                $scope.events = undefined;
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
            return $scope.program.name === "Burn Unit" || $scope.program.name === "Cholera Treatment Centre";
        };

        $scope.getDisplayValue = function(dataValue) {
            if (!dataValue.value) return "";

            if (_.endsWith(dataValue.code, "_referralLocations"))
                return $scope.referralLocations[dataValue.value].name;

            if (dataValue.optionSet && dataValue.optionSet.options.length > 0) {
                var option = _.find(dataValue.optionSet.options, function(o) {
                    return o.code === dataValue.value;
                });
                return option ? option.name : "";
            } else {
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
                desc: $scope.resourceBundle.syncModuleDataBlockDesc + period + ', ' + $scope.selectedModuleName
            }, 'dataValues');
        };

        $scope.submit = function() {
            var submitableEvents = $scope.events,
                submitablePeriods = _.uniq(_.pluck(submitableEvents, 'period')),
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
                showResultMessage("success", submitableEvents.length + $scope.resourceBundle.eventSubmitSuccess);
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
                showResultMessage('success', submitableEvents.length + $scope.resourceBundle.eventSubmitAndApproveSuccess);
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
            $scope.loadingResults = true;
            programEventRepository.findEventsByCode($scope.program.id, _.pluck($scope.originOrgUnits, "id"), $scope.filterParams.caseNumber).then(function(events) {
                var translatedEvents = translationsService.translate(events);
                $scope.events = translatedEvents;
                $scope.loadingResults = false;
            });

        };

        $scope.filterByDateRange = function() {
            $scope.loadingResults = true;
            var startDate = moment($scope.filterParams.startDate).format("YYYY-MM-DD");
            var endDate = moment($scope.filterParams.endDate).format("YYYY-MM-DD");

            programEventRepository.findEventsByDateRange($scope.program.id, _.pluck($scope.originOrgUnits, "id"), startDate, endDate).then(function(events) {
                var translatedEvents = translationsService.translate(events);
                $scope.events = translatedEvents;
                $scope.loadingResults = false;
            });

        };

        $scope.getOriginName = function(orgUnitId) {
            return _.find($scope.originOrgUnits, {
                "id": orgUnitId
            }).name;
        };

        $scope.$on('moduleWeekInfo', function(event, data) {
            $scope.selectedModule = data[0];
            $scope.week = data[1];
            init();
        });

        var init = function() {

            var loadModule = function() {
                return orgUnitRepository.get($routeParams.module).then(function(data) {
                    $scope.selectedModuleId = data.id;
                    $scope.selectedModuleName = data.name;
                    $scope.opUnitId = data.parent.id;
                });
            };

            var loadOriginOrgUnits = function() {
                return orgUnitRepository.findAllByParent($scope.selectedModuleId).then(function(data) {
                    $scope.originOrgUnits = data;
                });
            };

            var loadPrograms = function() {
                var getExcludedDataElementsForModule = function() {
                    return excludedDataElementsRepository.get($scope.selectedModuleId).then(function(data) {
                        return data ? _.pluck(data.dataElements, "id") : [];
                    });
                };

                var getProgram = function(excludedDataElements) {
                    return programRepository.getProgramForOrgUnit($scope.originOrgUnits[0].id).then(function(program) {
                        return programRepository.get(program.id, excludedDataElements).then(function(program) {
                            var translatedProgram = translationsService.translate([program]);
                            $scope.program = translatedProgram[0];
                            $scope.associatedProgramId = translatedProgram[0].id;
                        });
                    });
                };

                return getExcludedDataElementsForModule().then(getProgram);
            };

            var setUpProjectAutoApprovedFlag = function() {
                return orgUnitRepository.getParentProject($scope.selectedModuleId).then(function(orgUnit) {
                    $scope.projectIsAutoApproved = _.any(orgUnit.attributeValues, {
                        'attribute': {
                            'code': "autoApprove"
                        },
                        "value": "true"
                    });
                });
            };

            var getreferralLocations = function() {
                referralLocationsRepository.get($scope.opUnitId).then(function(referralLocations) {
                    $scope.referralLocations = referralLocations;
                });
            };

            showResultMessage($location.search().messageType, $location.search().message);

            $scope.filterBy = $routeParams.filterBy;
            if (!$scope.filterBy)
                $scope.filterBy = 'caseNumber';
            $scope.eventListTitle = $scope.resourceBundle.eventListTitle;
            $scope.noCasesMsg = $scope.resourceBundle.noCasesFound;
            $scope.loading = true;
            return loadModule()
                .then(getreferralLocations)
                .then(loadOriginOrgUnits)
                .then(loadPrograms)
                .then(setUpProjectAutoApprovedFlag)
                .then(loadEventsView)
                .finally(function() {
                    $scope.loading = false;
                });
        };

        init();
    };
});
