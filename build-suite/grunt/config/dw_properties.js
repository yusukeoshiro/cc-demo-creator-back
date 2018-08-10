/**
 * Commerce Cloud properties file
 *
 * This file is a centralized place to configure "environment variables".
 * Whenever new tasks are created, use the properties here for getting e.g. temporary/staging folders
 * or the target version name.
 *
 * Modify this file to change the location of those folders.
 *
 * Keeping those properties in this file makes it easier to adapt folder names to particular build environments.
 * The list of properties will be continuously extended whenever feasible.
 */
module.exports = {
    /**
     * Path to default configuration file
     */
    configFile: 'build/config.json',

    /**
     * Configuration parameters for (Browser-based) Site import/export features
     */
    impex: {
        site: {
            path: '/on/demandware.store/Sites-Site/default/ViewSiteImpex-Status',
            selector: '#unitSelection ~ table:nth-of-type(3)',
            importLabel: 'Site Import ({0})',
            exportLabel: 'Site Export ({0})'
        }
    },

    /**
     * Configuration parameters for WebDAV access
     */
    webDav: {
        cartridge_root: '/on/demandware.servlet/webdav/Sites/Cartridges/',
        impex_root: '/on/demandware.servlet/webdav/Sites/ImpEx/',
        site_import_root: '/on/demandware.servlet/webdav/Sites/ImpEx/src/instance/'
    },

    /**
     * Local folders for VCS checkout, code, and site import staging directories.
     * Output directory root declared separately and is mainly used for clean task.
     */
    folders: {
        repos: 'exports/<%= settings.project.name %>/',
        code: 'output/<%= settings.project.name %>/code/',
        site: 'output/<%= settings.project.name %>/site_import/',
        output: 'output/<%= settings.project.name %>/'
    },

    /**
     * Version info (build number, combined version name)
     * Combined version name is mainly used to properly name the code version (and code version zip file).
     */
    version: {
        build: '<%= settings.project.build %>',
        name: '<%= settings.project.version %>'
                    + '<% if(settings.project.build) print("-"); %><%= settings.project.build %>'
    }
};
