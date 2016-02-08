define([], function() {
    var shouldRedirectToLogin = function(rootScope, newUrl) {
        var accessingProductKeyPage = newUrl.endsWith('#/productKeyPage');
        return (rootScope.isLoggedIn || accessingProductKeyPage) ? false : true;
    };

    return {
        "shouldRedirectToLogin": shouldRedirectToLogin
    };
});

