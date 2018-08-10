module.exports = {
    options: {
        server: 'https://<%= environment.server %>',
        login: '<%= environment.username %>',
        password: '<%= environment.password %>',
        debug: false
    },
    default: {}
};
