define([], function() {
	return function($hustle, approvalDataRepository) {
        var approveData = function(approvalData, approvalFn, approvalType) {
            var saveToDhis = function() {
                return $hustle.publish({
                    "data": approvalData,
                    "type": approvalType
                }, "dataValues");
            };

            return approvalFn(approvalData).then(saveToDhis);
        };

        this.markDataAsComplete = function(data) {
            var dataForApproval = {
                "dataSets": data.dataSets,
                "period": data.period,
                "orgUnit": data.orgUnit,
                "storedBy": data.storedBy,
                "date": moment().toISOString(),
                "status": "NEW"
            };

            return approveData(dataForApproval, approvalDataRepository.saveLevelOneApproval, "uploadCompletionData").then(function() {
              return data;
            });
        };

        this.markDataAsApproved = function(data) {
            var dataForApproval = {
                "dataSets": data.dataSets,
                "period": data.period,
                "orgUnit": data.orgUnit,
                "createdByUsername": data.storedBy,
                "createdDate": moment().toISOString(),
                "isApproved": true,
                "status": "NEW"
            };

            return approveData(dataForApproval, approvalDataRepository.saveLevelTwoApproval, "uploadApprovalData");
        };
	};
});