define(["properties"], function(properties) {
    return function($http) {
        this.excludeDataElements = function(data){
            return $http({
                method: 'POST',
                url: properties.dhis.url + '/api/systemSettings/' + data.projectId,
                data: JSON.stringify(data.settings),
                headers: {
                    'Content-Type': 'text/plain'
                }
            }).then(function() {
                return data;
            });
        };
    };
});
