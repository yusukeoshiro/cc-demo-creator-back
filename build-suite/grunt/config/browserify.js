module.exports = {
    build: {
        options: {
            sourceMap: true,
            browserifyOptions: {
                debug: true
            }
        },
        files: [{
            expand: true,
            cwd: '<%= dw_properties.folders.code %>',
            src: '<% if(settings.optimize.browserify) print("**/cartridge/js/app.js"); else print("nullglob"); %>',
            dest: '<%= dw_properties.folders.code %>',
            rename: function (dest, src) {
                return dest + src.replace('js/', 'static/default/js/');
            }
        }]
    },
    dev: {
        options: {
            require: ['lodash', 'imagesloaded', 'promise'],
            sourceMap: true,
            browserifyOptions: {
                debug: true
            }
        },
        files: [{
            expand: true,
            cwd: '<% if(!settings.general.watch_path) print("./"); %><%= settings.general.watch_path %>',
            src: '<% if(settings.optimize.browserify) print("**/cartridge/js/app.js"); else print("nullglob"); %>',
            dest: '<% if(!settings.general.watch_path) print("./"); %><%= settings.general.watch_path %>',
            rename: function (dest, src) {
                return dest + src.replace('js/', 'static/default/js/');
            }
        }]
    }
};
