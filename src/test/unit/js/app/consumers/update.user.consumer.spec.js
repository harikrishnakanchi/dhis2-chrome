define(["updateUserConsumer"], function(UpdateUserConsumer) {

    describe("update user consumer", function() {
        var consumer, userService, message, user;

        beforeEach(function() {
            userService = jasmine.createSpyObj({}, ['update']);

            user = {
                username: "ProJ_1_Blah",
                password: "P@ssw0rd",
                userRole: {
                    name: 'SomeRole',
                    id: 'someId'
                }
            };

            message = {
                data: {
                    data: user,
                    type: "updateUser"
                }
            };
            consumer = new UpdateUserConsumer(userService);
        });

        it("should create system settings for a project", function() {
            consumer.run(message);
            expect(userService.update).toHaveBeenCalledWith(user);
        });
    });
});