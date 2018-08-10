module.exports = {
    code: {
        options: {
            src: [
                '<%= dw_properties.folders.code %>/*/**/*',
                '!<%= dw_properties.folders.code %>/*.zip'
            ],
            cwd: '<%= dw_properties.folders.code %>',
            target: '<%= dw_properties.version.name %>'
        }
    },
    site: {
        options: {
            src: [
                '<%= dw_properties.folders.site %><%= settings.siteImport.filenames.init %>/**/*',
                '!<%= dw_properties.folders.site %><%= settings.siteImport.filenames.init %>/**/*.zip'
            ],
            cwd: '<%= dw_properties.folders.site %><%= settings.siteImport.filenames.init %>/',
            target: '<%= settings.siteImport.filenames.init %>',
            targetFolder: '<%= dw_properties.folders.site %>'
        }
    },
    meta: {
        options: {
            src: [
                '<%= dw_properties.folders.site %><%= settings.siteImport.filenames.init %>/meta/*'
            ],
            cwd: '<%= dw_properties.folders.site %><%= settings.siteImport.filenames.init %>/',
            target: '<%= settings.siteImport.filenames.meta %>',
            targetFolder: '<%= dw_properties.folders.site %>'
        }
    }
};
