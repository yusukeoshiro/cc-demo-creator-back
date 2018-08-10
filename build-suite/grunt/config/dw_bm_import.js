module.exports = {
    site: {
        options: {
            server: 'https://<%= environment.server %>',
            archiveName: '<%= settings.siteImport.filenames.init %>.zip'
        }
    },
    meta: {
        options: {
            server: 'https://<%= environment.server %>',
            archiveName: '<%= settings.siteImport.filenames.meta %>.zip'
        }
    }
};
