define([], function() {
    return function($q, systemSettingService, patientOriginRepository, orgUnitRepository) {
        this.run = function(message) {
            var opUnitId = message.data.data;
            var getParentProjectPromise = orgUnitRepository.getParentProject(opUnitId);
            var getPatientOriginPromise = patientOriginRepository.get(opUnitId);
            return $q.all([getParentProjectPromise, getPatientOriginPromise]).then(function(data) {
                var projectId = data[0].id;
                var updatedPatientOrigin = data[1];
                return systemSettingService.upsertPatientOriginDetails(projectId, updatedPatientOrigin);
            });
        };
    };
});
