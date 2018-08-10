module.exports = function () {
    return {
        options: {
            server: 'https://<%= environment.server %>',
            archiveName: '<%= settings.siteImport.filenames.content %>'
        },
        default: {
        }
    };
};
