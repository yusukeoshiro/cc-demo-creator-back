'use strict';

/**
 * Activate code version in BM.
 */
module.exports = function (grunt) {
    grunt.registerMultiTask('dw_bm_activate_code', 'Activate code version in BM', function () {
        var options = this.options(),
            done = this.async(),
            request = require('../lib/util/bm_request'),
            bmUtils = require('../lib/util/dw_bm_utils');

        if (!options.codeVersionID) {
            throw 'No code version name provided for this process';
        }

        grunt.log.writeln(' * Activating code version: ' + options.codeVersionID);

        // request import & export page
        var httpOptions = {
            url: options.server +
              '/on/demandware.store/Sites-Site/default/ViewCodeDeployment-Activate',
            form: {
                CodeVersionID: options.codeVersionID
            },
            jar: true
        };

        request.post(httpOptions, function (error, resp, body) {
            if (!bmUtils.isLoggedIn(body)) {
                grunt.fail.fatal('Not able to login into business manager');
            } else if (error) {
                grunt.fail.fatal(error);
            } else if (typeof (resp) == 'undefined') {
                grunt.fail.fatal('Error activating code version, could not get response from server.');
            } else if (parseInt(resp.statusCode) !== 200) {
                grunt.log.writeln(JSON.stringify(resp, null, 2));
                grunt.fail.fatal('Error activating code version, got status ' + resp.statusCode);
            } else {
                grunt.log.ok('Code version activated successfully.');
                done();
            }
        });
    });
};
