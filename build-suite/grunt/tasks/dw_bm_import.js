'use strict';

/**
 * Imports site template configuration content.
 **/
module.exports = function (grunt) {
    grunt.registerMultiTask('dw_bm_import', 'Import site template configuration', function () {
        var options = this.options(),
            done = this.async(),
            request = require('../lib/util/bm_request'),
            bmUtils = require('../lib/util/dw_bm_utils');

        if (!options.archiveName) {
            throw 'No archive name provided for this process';
        }

        grunt.log.verbose.writeln('Import site template configuration ' + options.archiveName);

        // request import & export page
        request.post({
            url: options.server + '/on/demandware.store/Sites-Site/default/ViewSiteImpex-Dispatch',
            jar: true,
            form: {
                ImportFileName: options.archiveName,
                import: 'OK',
                realmUse: 'false'
            }
        }, function (error, resp, body) {
            if (!bmUtils.isLoggedIn(body)) {
                throw 'Not able to login into business manager';
            } else {
                done();
            }
        });
    });
};
