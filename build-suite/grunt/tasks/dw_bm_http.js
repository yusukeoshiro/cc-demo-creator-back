'use strict';

/**
 * BM HTTP task
 **/
module.exports = function (grunt) {
    grunt.registerMultiTask('dw_bm_http', 'General task for HTTP request to BM', function () {
        var options = this.options(),
            done = this.async(),
            request = require('../lib/util/bm_request');

        request.post(options, function (error/* , response, body*/) {
            if (error) {
                grunt.fail.fatal('Call to ' + options.url + ' finished with error:' + error);
            }

            done();
        });
    });
};
