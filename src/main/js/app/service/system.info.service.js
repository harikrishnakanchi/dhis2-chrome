define(['dhisUrl', 'lodash', 'moment'], function (dhisUrl, _, moment) {
    return function ($http, $q) {
        var version, self = this;

        var cacheVersionNumber = function (systemInfo) {
            version = systemInfo.version;
            return systemInfo;
        };

        var getSystemInfo = function () {
            return $http.get(dhisUrl.systemInfo)
                .then(_.property('data'))
                .then(cacheVersionNumber);
        };

        this.getServerDate = function () {
            return getSystemInfo()
                .then(function (systemInfo) {
                    var timeFormat = 'YYYY-MM-DDTHH:mm:ss.SSS';
                    var serverDate = moment.utc(systemInfo.serverDate, timeFormat);
                    var isServerTimeValid = serverDate.isValid();
                    return isServerTimeValid ? serverDate.format(timeFormat) : moment.utc().format(timeFormat);
                });
        };

        //TODO: Remove this method when upgraded to DHIS 2.25
        this.getVersion = function () {
            return version ? $q.when(version) : getSystemInfo().then(self.getVersion);
        };
    };
});
