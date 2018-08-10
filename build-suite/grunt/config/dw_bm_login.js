module.exports = function () {
    return {
        options: {
            server: 'https://<%= environment.server %>',
            username: '<%= environment.username %>',
            password: '<%= environment.password %>'
        },

        default: { }
    };
};
