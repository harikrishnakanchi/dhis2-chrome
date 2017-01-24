define(['moment', 'lodashUtils'], function(moment, _) {
    return function(programService, systemInfoService, programRepository, changeLogRepository, $q, mergeBy) {
        this.run = function(message) {
            return getServerTime()
                .then(download)
                .then(mergeAndSave)
                .then(updateChangeLog);
        };

        var getServerTime = function () {
          return systemInfoService.getServerDate().then(function (serverTime) {
             return { downloadStartTime: serverTime };
          });
        };

        var download = function(data) {
            return changeLogRepository.get("programs").then(programService.getAll).then(function (programs) {
                return _.merge({ programs: programs }, data);
            });
        };

        var mergeAndSave = function(data) {
            var programIds = _.map(data.programs, "id");
            return programRepository.findAll(programIds)
                .then(_.curry(mergeBy.union)("organisationUnits", "id", data.programs))
                .then(programRepository.upsertDhisDownloadedData)
                .then(function () { return data; });
        };

        var updateChangeLog = function(data) {
            return changeLogRepository.upsert("programs", data.downloadStartTime);
        };
    };
});
