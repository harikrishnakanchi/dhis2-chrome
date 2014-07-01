define([], function() {
    return function(userService) {
        this.run = function(message) {
            console.debug("Updating user: ", message.data.data);
            return userService.update(message.data.data);
        };
    };
});