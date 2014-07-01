define([], function() {
    return function(userService) {
        this.run = function(message) {
            console.debug("Creating user: ", message.data.data);
            return userService.create(message.data.data);
        };
    };
});