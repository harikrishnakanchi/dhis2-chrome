define(['lodash'], function (_) {
        var DEFAULT_PAGE_REQUESTS_MAX_LIMIT = 100;

        var paginateRequest = function (callback, queryParams, maxPageRequests, result) {
            queryParams.totalPages = true;
            queryParams.page = queryParams.page || 1;
            result = result || [];
            maxPageRequests = maxPageRequests || DEFAULT_PAGE_REQUESTS_MAX_LIMIT;

            return callback(queryParams).then(function(response) {
                var responseData = response.data || [],
                    totalPages = (response.pager && response.pager.pageCount) || 0,
                    lastPageReached = queryParams.page >= totalPages,
                    pageLimitReached = queryParams.page >= maxPageRequests;

                result.push(responseData);

                if(lastPageReached || pageLimitReached || _.isEmpty(responseData)) {
                    return _.flatten(result);
                } else {
                    queryParams.page++;
                    return paginateRequest(callback, queryParams, maxPageRequests, result);
                }
            });
        };

        return {
            "paginateRequest": paginateRequest
        };
});