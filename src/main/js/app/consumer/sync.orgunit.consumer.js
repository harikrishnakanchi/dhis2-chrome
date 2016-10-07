define(['moment', 'lodash'], function (moment, _) {
    return function ($q, orgUnitService, orgUnitRepository) {
        this.run = function (message) {
            var orgUnitId = message.data.data.orgUnitId;

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

            var checkIsDHISMoreRecent = function (data) {
                var isPraxisOrgUnitMoreRecentThanDHIS = function (orgUnitFromPraxis, orgUnitFromDHIS) {
                    return moment(orgUnitFromDHIS.lastUpdated).isBefore(moment(orgUnitFromPraxis.clientLastUpdated));
                };
                data.isOrgUnitNewlyCreatedOnPraxis = !data.orgUnitFromDHIS;
                data.isDataMoreRecentOnDHIS = !(data.isOrgUnitNewlyCreatedOnPraxis || isPraxisOrgUnitMoreRecentThanDHIS(data.orgUnitFromPraxis, data.orgUnitFromDHIS));
                return data;
            };

            var upsertToDHIS = function (data) {
                var dhisDataSetIds = data.orgUnitFromDHIS ? _.map(data.orgUnitFromDHIS.dataSets, 'id') : [];
                var praxisDataSetIds = _.map(data.orgUnitFromPraxis.dataSets, 'id');
                var dataSetIdsToBeAssociated = _.difference(praxisDataSetIds, dhisDataSetIds);
                var dataSetIdsToBeUnassociated = _.difference(dhisDataSetIds, praxisDataSetIds);

                var orgUnitUpsert = function () {
                    if (data.isOrgUnitNewlyCreatedOnPraxis) {
                        return orgUnitService.create(data.orgUnitFromPraxis);
                    } else {
                        return orgUnitService.update(data.orgUnitFromPraxis.id, data.orgUnitFromPraxis);
                    }
                };

                var associateDataSets = function () {
                    return _.reduce(dataSetIdsToBeAssociated, function (promises, dataSetId) {
                        return promises.then(function () {
                            return orgUnitService.assignDataSetToOrgUnit(data.orgUnitFromPraxis.id, dataSetId);
                        });
                    }, $q.when());
                };

                var unassociateDataSets = function () {
                    return _.reduce(dataSetIdsToBeUnassociated, function (promises, dataSetId) {
                        return promises.then(function () {
                            return orgUnitService.removeDataSetFromOrgUnit(data.orgUnitFromPraxis.id, dataSetId);
                        });
                    }, $q.when());
                };

                return orgUnitUpsert()
                    .then(associateDataSets)
                    .then(unassociateDataSets);
            };

            var updatePraxis = function (data) {
                return orgUnitRepository.upsert(data.orgUnitFromDHIS);
            };

            var syncData = function (data) {
                if (data.isDataMoreRecentOnDHIS) {
                    return updatePraxis(data);
                } else {
                    return upsertToDHIS(data);
                }
            };

            return $q.all({
                orgUnitFromDHIS: downloadFromDHIS(),
                orgUnitFromPraxis: getFromPraxis()
            }).then(checkIsDHISMoreRecent)
                .then(syncData);
        };
    };
});