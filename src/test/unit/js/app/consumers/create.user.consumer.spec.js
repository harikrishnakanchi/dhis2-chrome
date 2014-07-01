define(["createUserConsumer"], function(CreateUserConsumer) {

    describe("create user consumer", function() {
        var consumer, userService, message, user;

        beforeEach(function() {
            userService = jasmine.createSpyObj({}, ['create']);

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
                    type: "createUser"
                }
            };
            consumer = new CreateUserConsumer(userService);
        });

        it("should create system settings for a project", function() {
            consumer.run(message);
            expect(userService.create).toHaveBeenCalledWith(user);
        });
    });
});