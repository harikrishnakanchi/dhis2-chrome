define(["lodash"], function(_) {
    return function($q, dataStoreService, patientOriginRepository, mergeBy) {
        this.run = function(message) {
            var opUnitId = message.data.data;
            return $q.all({
                remotePatientOrigins: dataStoreService.getPatientOrigins([opUnitId]),
                localPatientOrigins: patientOriginRepository.get(opUnitId)
            }).then(function (data) {
                var remotePatientOrigins = _.first(data.remotePatientOrigins);
                if (!remotePatientOrigins) {
                    return dataStoreService.createPatientOrigins(opUnitId, data.localPatientOrigins);
                }
                else {
                    var remoteOrigins = _.get(remotePatientOrigins, 'origins', []);
                    var localOrigins = _.get(data, 'localPatientOrigins.origins', []);
                    var mergedOrigins = mergeBy.lastUpdated({"remoteTimeField": "clientLastUpdated", "localTimeField": "clientLastUpdated"}, remoteOrigins, localOrigins);
                    var updatedPatientOriginDetails = {orgUnit: opUnitId, origins: mergedOrigins};
                    return patientOriginRepository.upsert(updatedPatientOriginDetails).then(function () {
                        return dataStoreService.updatePatientOrigins(opUnitId, updatedPatientOriginDetails);
                    });
                }
            });
        };
    };
});
