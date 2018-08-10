module.exports = {
    options: {
        processors: [
            require('autoprefixer')({})
        ]
    },
    build: {
        files: [{
            expand: true,
            cwd: '<%= dw_properties.folders.code %>',
            src: '<% if(settings.optimize.postcss) print("*/cartridge/static/*/css/**/*.css"); else print("nullglob");%>',
            dest: '<%= dw_properties.folders.code %>'
        }]
    },
    dev: {
        files: [{
            expand: true,
            cwd: '<%= settings.general.watch_path %>/',
            src: '<% if(settings.optimize.postcss) print("*/cartridge/static/*/css/**/*.css"); else print("nullglob");%>',
            dest: '<%= settings.general.watch_path %>/'
        }]
    }
};
