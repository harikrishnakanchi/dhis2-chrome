define(['dhisUrl', 'lodash', 'moment'], function (dhisUrl, _, moment) {
    return function ($http) {
        this.getServerDate = function () {
            return $http.get(dhisUrl.systemInfo)
                .then(_.property('data'))
                .then(function (systemInfo) {
                    return moment(systemInfo.serverDate).toISOString();
                });
        };
    };
});
