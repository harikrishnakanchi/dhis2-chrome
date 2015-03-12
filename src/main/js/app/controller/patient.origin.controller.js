define(["lodash", "moment", "dhisId"], function(_, moment, dhisId) {
    return function($scope, $hustle, patientOriginRepository) {
        var patientOrigins = [];

        $scope.save = function() {
            var publishMessage = function(data, action) {
                return $hustle.publish({
                    "data": data,
                    "type": action
                }, "dataValues");
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

            $scope.patientOrigin.id = dhisId.get($scope.patientOrigin.name);
            $scope.patientOrigin.clientLastUpdated = moment().toISOString();
            patientOrigins.push($scope.patientOrigin);

            var payload = {
                orgUnit: $scope.orgUnit.id,
                origins: patientOrigins
            };

            return patientOriginRepository.upsert(payload)
                .then(_.partial(publishMessage, payload, "uploadPatientOriginDetails"))
                .then(onSuccess, onFailure);
        };

        var init = function() {
            $scope.patientOrigin = {};
            return patientOriginRepository.get($scope.orgUnit.id).then(function(patientOriginDetails) {
                if (!_.isEmpty(patientOriginDetails))
                    patientOrigins = patientOriginDetails.origins;
            });
        };

        init();
    };
});
