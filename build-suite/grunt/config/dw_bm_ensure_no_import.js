module.exports = function () {
    return {
        options: {
            server: 'https://<%= environment.server %>'
        },
        content: {
            options: {
                archiveName: '<%= settings.siteImport.filenames.content %>',
                path: '<%= dw_properties.impex.site.path %>',
                selector: '<%= dw_properties.impex.site.selector %>',
                processLabel: '<%= dw_properties.impex.site.importLabel %>'
            }
        },
        config: {
            options: {
                archiveName: '<%= settings.siteImport.filenames.init %>.zip',
                path: '<%= dw_properties.impex.site.path %>',
                selector: '<%= dw_properties.impex.site.selector %>',
                processLabel: '<%= dw_properties.impex.site.importLabel %>'
            }
        }
    };
};
