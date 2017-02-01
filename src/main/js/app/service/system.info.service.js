define(['dhisUrl', 'lodash', 'moment'], function (dhisUrl, _, moment) {
    return function ($http) {
        this.getServerDate = function () {
            return $http.get(dhisUrl.systemInfo)
                .then(_.property('data'))
                .then(function (systemInfo) {
                    var timeFormat = 'YYYY-MM-DDThh:mm:ss.SSS';
                    var serverDate = moment.utc(systemInfo.serverDate, timeFormat);
                    var isServerTimeValid = serverDate.isValid();
                    return isServerTimeValid ? serverDate.format(timeFormat) : moment.utc().format(timeFormat);
                });
        };
    };
});
