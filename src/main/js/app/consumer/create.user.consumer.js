define([], function() {
    return function(userService) {
        this.run = function(message) {
            return userService.create(message.data.data);
        };
    };
});
