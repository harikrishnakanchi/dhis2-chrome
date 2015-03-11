define(["lodash", "moment"], function(_, moment) {
    return function($scope, $hustle, patientOriginRepository) {

        var publishMessage = function(data, action) {
            return $hustle.publish({
                "data": data,
                "type": action
            }, "dataValues");
        };

        $scope.save = function(patientOrigin) {
            var projectOrigins = _.isEmpty($scope.projectOrigins) ? [] : $scope.projectOrigins;
            projectOrigins.push(patientOrigin);

            var payload = {
                key: $scope.projectId,
                value: {
                    clientLastUpdated: moment().toISOString(),
                    origins: projectOrigins
                }
            };

            var onSuccess = function(data) {
                $scope.saveFailure = false;
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm($scope.orgUnit, "savedOriginDetails");
                return data;
            };

            var onFailure = function(error) {
                $scope.saveSuccess = false;
                $scope.saveFailure = true;
                return error;
            };

            return patientOriginRepository.upsert(payload).
            then(_.partial(publishMessage, payload, "uploadPatientOriginDetails")).then(onSuccess, onFailure);
        };

        var getPatientOriginDetails = function() {
            return patientOriginRepository.get($scope.projectId).then(function(patientOriginDetails) {
                if (!_.isEmpty(patientOriginDetails) && !_.isEmpty(patientOriginDetails.value))
                    $scope.projectOrigins = patientOriginDetails.value.origins;
            });
        };

        var init = function() {
            $scope.projectId = $scope.orgUnit.id;
            return getPatientOriginDetails($scope.projectId);
        };

        init();

    };
});
