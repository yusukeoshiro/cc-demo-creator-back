module.exports = {
    build: {
        options: {
            style: 'expanded',
            sourceMap: true
        },
        files: [{
            expand: true,
            cwd: '<%= dw_properties.folders.code %>',
            src: '<% if(settings.sass.enabled) '
                    + 'print("**/" + settings.sass.sourcePath + "/**/" + settings.sass.sourceFile); '
                    + 'else print("nullglob");%>',
            ext: '.css',
            dest: '<%= dw_properties.folders.code %>',
            _path: '<%= settings.sass.sourcePath %>',
            rename: function (dest, src) {
                var fileName = src.substring(src.lastIndexOf('/') + 1);
                var path = src.substring(0, src.lastIndexOf('/'));

                path = path.replace(this._path, 'static');
                return dest + path + '/css/' + fileName;
            }
        }]
    },
    dev: {
        options: {
            style: 'expanded',
            sourceMap: true
        },
        files: [{
            expand: true,
            cwd: '<% if(!settings.general.watch_path) print("./"); %><%= settings.general.watch_path %>',
            src: '<% if(settings.sass.enabled) '
                + 'print("**/" + settings.sass.sourcePath + "/**/" + settings.sass.sourceFile); '
                + 'else print("nullglob");%>',
            ext: '.css',
            dest: '<% if(!settings.general.watch_path) print("./"); %><%= settings.general.watch_path %>',
            rename: function (dest, src) {
                var fileName = src.substring(src.lastIndexOf('/') + 1);
                var path = src.substring(0, src.lastIndexOf('/'));

                path = path.replace('scss', 'static');
                return dest + path + '/css/' + fileName;
            }
        }]
    }
};
