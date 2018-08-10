module.exports = {
    all: {
        files: [{
            expand: true,
            cwd: '<%= dw_properties.folders.code %>',
            src: ['*/cartridge/static/**/*!(.min).css', '!*/cartridge/static/**/*.min.css'],
            dest: '<%= dw_properties.folders.code %>'
        }]
    }
};
