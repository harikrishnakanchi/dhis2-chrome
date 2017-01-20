define(['dhisUrl', 'lodash', 'moment'], function (dhisUrl, _, moment) {
    return function ($http) {
        this.getServerDate = function () {
            return $http.get(dhisUrl.systemInfo)
                .then(_.property('data'))
                .then(function (systemInfo) {
                    var serverDate = moment.utc(systemInfo.serverDate, 'YYYY-MM-DD hh:mm:ss.SSS');
                    var isServerTimeValid = serverDate.isValid();
                    return isServerTimeValid ? serverDate.toISOString() : moment().toISOString();
                });
        };
    };
});
