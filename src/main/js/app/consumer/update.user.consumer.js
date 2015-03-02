define([], function() {
    return function(userService) {
        this.run = function(message) {
            return userService.update(message.data.data);
        };
    };
});
