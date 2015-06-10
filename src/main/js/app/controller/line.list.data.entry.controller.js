define(["lodash", "moment", "dhisId", "properties"], function(_, moment, dhisId, properties) {
    return function($scope, db, programEventRepository, optionSetRepository) {
        var resetForm = function() {
            $scope.form = $scope.form || {};
            $scope.numberPattern = "^[1-9][0-9]*$";
            $scope.dataValues = {};
            $scope.patientOrigin = {};
            $scope.minDateInCurrentPeriod = $scope.week.startOfWeek;
            $scope.maxDateInCurrentPeriod = $scope.week.endOfWeek;
            $scope.isNewMode = true;
            if ($scope.form && $scope.form.eventDataEntryForm) {
                $scope.form.eventDataEntryForm.$setPristine();
            }
            $scope.$broadcast('angucomplete-alt:clearInput');
        };

        var getPeriod = function() {
            return moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]WW");
        };

        var getDataValuesAndEventDate = function(programStage) {
            var eventDate = null;
            var compulsoryFieldsPresent = true;

            var formatValue = function(value) {
                if (_.isObject(value) && value.originalObject)
                    return value.originalObject.code;
                if (_.isObject(value) && value.code)
                    return value.code;
                if (_.isDate(value))
                    return moment(value).format("YYYY-MM-DD");
                return value;
            };

            var dataValuesList = _.flatten(_.map(programStage.programStageSections, function(sections) {
                return _.map(sections.programStageDataElements, function(psde) {
                    var value = formatValue($scope.dataValues[psde.dataElement.id]);

                    if ($scope.isEventDateSubstitute(psde.dataElement)) {
                        eventDate = value;
                    }

                    if (psde.compulsory) {
                        if (psde.dataElement.type === "int") {
                            compulsoryFieldsPresent = isNaN(value) || value === null ? false : compulsoryFieldsPresent;
                        } else if (_.isEmpty(value))
                            compulsoryFieldsPresent = false;
                    }

                    return ({
                        "dataElement": psde.dataElement.id,
                        "value": value
                    });
                });
            }));
            return {
                dataValues: dataValuesList,
                eventDate: eventDate,
                compulsoryFieldsPresent: compulsoryFieldsPresent
            };
        };

        var upsertEvent = function() {
            var payload = {
                "events": [$scope.event]
            };
            return programEventRepository.upsert(payload).then(function() {
                return $scope.showResultMessage("success", $scope.resourceBundle.eventSaveSuccess);
            });
        };

        $scope.isEventDateSubstitute = function(dataElement) {
            var attr = _.find(dataElement.attributeValues, function(attributeValue) {
                return attributeValue.attribute.code === "useAsEventDate";
            });
            return attr && attr.value === "true";
        };

        $scope.update = function(programStage) {
            var buildPayloadFromView = function() {
                var dataValuesAndEventDate = getDataValuesAndEventDate(programStage);
                $scope.event.orgUnit = $scope.patientOrigin.selected.id;
                $scope.event.eventDate = dataValuesAndEventDate.eventDate;
                $scope.event.localStatus = dataValuesAndEventDate.compulsoryFieldsPresent ? "UPDATED_DRAFT" : "UPDATED_INCOMPLETE_DRAFT";
                $scope.event.dataValues = dataValuesAndEventDate.dataValues;
            };

            buildPayloadFromView();
            upsertEvent().then($scope.loadEventsView);
        };

        $scope.save = function(programStage, addAnother) {
            var buildPayloadFromView = function() {
                var dataValuesAndEventDate = getDataValuesAndEventDate(programStage);

                $scope.event = {
                    "event": dhisId.get($scope.program.id + programStage.id + $scope.selectedModule.id + moment().format()),
                    "program": $scope.program.id,
                    "programStage": programStage.id,
                    "orgUnit": $scope.patientOrigin.selected.id,
                    "eventDate": dataValuesAndEventDate.eventDate,
                    "localStatus": dataValuesAndEventDate.compulsoryFieldsPresent ? "NEW_DRAFT" : "NEW_INCOMPLETE_DRAFT",
                    "dataValues": dataValuesAndEventDate.dataValues
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
            var allDataElementsMap = {};
            var loadAllDataElements = function() {
                if ($scope.program && $scope.program.programStages)
                    allDataElementsMap = _.indexBy(_.pluck(_.flatten(_.pluck(_.flatten(_.pluck($scope.program.programStages, "programStageSections")), "programStageDataElements")), "dataElement"), "id");
            };

            var loadOptionSets = function() {
                return optionSetRepository.getOptionSetMapping($scope.resourceBundle).then(function(data) {
                    $scope.optionSetMapping = data.optionSetMap;
                });
            };

            var loadEvent = function() {
                var formatValue = function(dv) {
                    var de = allDataElementsMap[dv.dataElement];
                    if (de && de.optionSet) {
                        return _.find($scope.optionSetMapping[de.optionSet.id], function(optionSet) {
                            return optionSet.code === dv.value;
                        });
                    }

                    if (dv.type === "date") {
                        if (dv.value)
                            dv.value = dv.value.replace(/-/g, ',');
                        return new Date(dv.value);
                    }

                    if (dv.type === "int") {
                        return parseInt(dv.value);
                    }

                    return dv.value;
                };
                if ($scope.event) {
                    $scope.isNewMode = false;
                    $scope.patientOrigin.selected = $scope.originOrgUnitsById[$scope.event.orgUnit];
                    _.forEach($scope.event.dataValues, function(dv) {
                        $scope.dataValues[dv.dataElement] = formatValue(dv);
                    });
                }
            };

            $scope.loading = true;
            resetForm();
            loadAllDataElements();
            loadOptionSets().then(loadEvent).finally(function() {
                $scope.loading = false;
            });
        };

        init();
    };
});
