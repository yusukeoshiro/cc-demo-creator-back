module.exports = {
    options: {
        url: '<%= environment.server %>',

        two_factor: {
            enabled: '<%= environment.two_factor.enabled %>',
            cert: '<%= environment.two_factor.cert %>',
            password: '<%= environment.two_factor.password %>',
            url: '<%= environment.two_factor.url %>'
        }
    },

    code: {
        options: {
            mode: 'code',
            release_path: '<%= dw_properties.webDav.cartridge_root %>',
            cleanup: '<%= settings.upload.cleanup %>'
        },
        files: {
            src: '<%= dw_properties.folders.code %>*.zip'
        }
    },

    site: {
        options: {
            release_path: '<%= dw_properties.webDav.site_import_root %>'
        },
        files: {
            src: '<%= dw_properties.folders.site %><%= settings.siteImport.filenames.init %>*.zip'
        }
    },

    meta: {
        options: {
            release_path: '<%= dw_properties.webDav.site_import_root %>'
        },
        files: {
            src: '<%= dw_properties.folders.site %><%= settings.siteImport.filenames.meta %>.zip'
        }
    }
};
