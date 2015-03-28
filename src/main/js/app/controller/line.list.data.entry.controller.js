define(["lodash", "moment", "dhisId", "properties"], function(_, moment, dhisId, properties) {
    return function($scope, $timeout, $location, $anchorScroll, db, programEventRepository) {
        var resetForm = function() {
            $scope.form = $scope.form || {};
            $scope.numberPattern = "^[1-9][0-9]*$";
            $scope.dataValues = {};
            $scope.eventDates = {};
            $scope.patientOrigin = {};
            $scope.minDateInCurrentPeriod = $scope.week.startOfWeek;
            $scope.maxDateInCurrentPeriod = $scope.week.endOfWeek;
            $scope.isNewMode = true;
            if ($scope.form && $scope.form.eventDataEntryForm) {
                $scope.form.eventDataEntryForm.$setPristine();
            }
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var getPeriod = function() {
            return moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]W");
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

        var getDataValues = function(programStage) {
            var formatValue = function(value) {
                return _.isDate(value) ? moment(value).format("YYYY-MM-DD") : value;
            };

            return _.map(programStage.programStageDataElements, function(psde) {
                return ({
                    "dataElement": psde.dataElement.id,
                    "value": formatValue($scope.dataValues[psde.dataElement.id])
                });
            });
        };

        var upsertEvent = function() {
            var payload = {
                "events": [$scope.event]
            };
            return programEventRepository.upsert(payload).then(function() {
                return showResultMessage("success", $scope.resourceBundle.eventSaveSuccess);
            });
        };

        $scope.getEventDateNgModel = function(eventDates, programId, programStageId) {
            eventDates[programId] = eventDates[programId] || {};
            eventDates[programId][programStageId] = eventDates[programId][programStageId] || moment($scope.minDateInCurrentPeriod).toDate();
            return eventDates[programId];
        };

        $scope.getOptionsFor = function(optionSetId) {
            var optionSet = _.find($scope.optionSets, function(os) {
                return optionSetId === os.id;
            });

            var options = optionSet ? optionSet.options : [];
            _.each(options, function(o) {
                o.displayName = $scope.resourceBundle[o.id] || o.name;
            });

            return options;
        };

        $scope.update = function(programStage) {
            var buildPayloadFromView = function() {
                $scope.event.orgUnit = $scope.patientOrigin.selected.id;
                $scope.event.eventDate = moment($scope.eventDates[$scope.event.program][$scope.event.programStage]).format("YYYY-MM-DD");
                $scope.event.localStatus = "UPDATED_DRAFT";
                $scope.event.dataValues = getDataValues(programStage);
            };

            buildPayloadFromView();
            upsertEvent().then($scope.loadEventsView);
        };

        $scope.save = function(programStage, addAnother) {
            var buildPayloadFromView = function() {
                $scope.event = {
                    "event": dhisId.get($scope.program.id + programStage.id + $scope.currentModule.id + moment().format()),
                    "program": $scope.program.id,
                    "programStage": programStage.id,
                    "orgUnit": $scope.patientOrigin.selected.id,
                    "eventDate": moment($scope.eventDates[$scope.program.id][programStage.id]).format("YYYY-MM-DD"),
                    "localStatus": "NEW_DRAFT",
                    "dataValues": getDataValues(programStage)
                };
            };

            buildPayloadFromView();
            upsertEvent().then(function() {
                if (addAnother)
                    resetForm();
                else
                    $scope.loadEventsView();
            });
        };

        var init = function() {
            var loadOptionSets = function() {
                var store = db.objectStore("optionSets");
                return store.getAll().then(function(opSets) {
                    $scope.optionSets = opSets;
                });
            };

            var loadEvent = function() {
                if ($scope.event) {
                    $scope.isNewMode = false;
                    $scope.patientOrigin.selected = $scope.originOrgUnitsById[$scope.event.orgUnit];
                    $scope.eventDates[$scope.event.program] = $scope.eventDates[$scope.event.program] ? $scope.eventDates[$scope.event.program] : {};
                    $scope.eventDates[$scope.event.program][$scope.event.programStage] = new Date($scope.event.eventDate);
                    _.forEach($scope.event.dataValues, function(dv) {
                        $scope.dataValues[dv.dataElement] = dv.type === 'date' ? new Date(dv.value) : dv.value;
                    });
                }
            };

            $scope.loading = true;
            resetForm();
            loadOptionSets().then(loadEvent).finally(function() {
                $scope.loading = false;
            });
        };

        init();
    };
});
