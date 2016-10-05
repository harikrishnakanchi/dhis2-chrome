define(['moment'], function (moment) {
    return function ($q, orgUnitService, orgUnitRepository) {
        this.run = function (message) {
            var orgUnitId = message.data.data.id;

            var downloadFromDHIS = function () {
                return orgUnitService.get(orgUnitId).then(function (orgUnitFromDHIS) {
                    return orgUnitFromDHIS;
                });
            };

            var getFromPraxis = function () {
                return orgUnitRepository.get(orgUnitId).then(function (orgUnitFromPraxis) {
                    return orgUnitFromPraxis;
                });
            };

            var upsertToDHIS = function (data) {
                var isPraxisOrgUnitMoreRecentThanDHIS = function (orgUnitFromPraxis, orgUnitFromDHIS) {
                    return moment(orgUnitFromDHIS.lastUpdated).isBefore(moment(orgUnitFromPraxis.clientLastUpdated));
                };
                var isOrgUnitNewlyCreatedOnPraxis = !data.orgUnitFromDHIS;
                if (isOrgUnitNewlyCreatedOnPraxis || isPraxisOrgUnitMoreRecentThanDHIS(data.orgUnitFromPraxis, data.orgUnitFromDHIS)) {
                    return orgUnitService.upsert(data.orgUnitFromPraxis).then(function () {
                        return data;
                    });
                } else {
                    return orgUnitRepository.upsert(data.orgUnitFromDHIS).then(function () {
                        return data;
                    });
                }
            };

            var associateDataSets = function (data) {
                var dataSets = data.orgUnitFromPraxis.dataSets;
                var orgUnitId = data.orgUnitFromPraxis.id;
                return _.reduce(dataSets, function (promises, dataSet) {
                    return promises.then(function () {
                        return orgUnitService.assignDataSetToOrgUnit(orgUnitId, dataSet.id);
                    });
                }, $q.when());
            };

            return $q.all({
                orgUnitFromDHIS: downloadFromDHIS(),
                orgUnitFromPraxis: getFromPraxis()
            }).then(upsertToDHIS)
                .then(associateDataSets);
        };
    };
});