module.exports = function () {
    return {
        options: {
            server: 'https://<%= environment.server %>',
            codeVersionID: '<%= dw_properties.version.name %>'
        },
        default: {
        }
    };
};
