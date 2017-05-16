define(["lodash"], function(_) {
    return function($q, dataStoreService, patientOriginRepository, orgUnitRepository, mergeBy) {
        this.run = function(message) {
            var opUnitId = message.data.data;
            var getParentProjectPromise = orgUnitRepository.getParentProject(opUnitId).then(_.property('id'));
            return $q.all({
                remotePatientOrigins: getParentProjectPromise.then(_.partialRight(dataStoreService.getPatientOrigins, opUnitId)),
                localPatientOrigins: patientOriginRepository.get(opUnitId),
                projectId: getParentProjectPromise
            }).then(function (data) {
                var projectId = data.projectId;
                var remotePatientOrigins = data.remotePatientOrigins;
                if (!remotePatientOrigins) {
                    return dataStoreService.createPatientOrigins(projectId, opUnitId, data.localPatientOrigins);
                }
                else {
                    var remoteOrigins = _.get(remotePatientOrigins, 'origins', []);
                    var localOrigins = _.get(data, 'localPatientOrigins.origins', []);
                    var mergedOrigins = mergeBy.lastUpdated({"remoteTimeField": "clientLastUpdated", "localTimeField": "clientLastUpdated"}, remoteOrigins, localOrigins);
                    var updatedPatientOriginDetails = _.set(remotePatientOrigins, 'origins', mergedOrigins);
                    return patientOriginRepository.upsert(updatedPatientOriginDetails).then(function () {
                        return dataStoreService.updatePatientOrigins(projectId, opUnitId, updatedPatientOriginDetails);
                    });
                }
            });
        };
    };
});
