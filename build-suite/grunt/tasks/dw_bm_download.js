'use strict';

/**
 *  Download an export package from business manager.
 */
module.exports = function (grunt) {
    grunt.registerMultiTask('dw_bm_download', 'Download export packages', function () {
        var request = require('../lib/util/bm_request'),
            bmUtils = require('../lib/util/dw_bm_utils'),
            cheerio = require('cheerio'),
            fs = require('fs'),
            done = this.async(),
            options = this.options();

        var exportName = grunt.option('export-name') || grunt.config.get('generatedExportConfigName');

        if (!exportName) {
            grunt.fail.warn('Export name is not set, do not know which export to download');
        }

        /**
         * Download the export file.
         *
         * @param {string} path - path of the file
         */
        var downloadFile = function (path) {
            var uri = options.server + path;

            // strip part after?
            uri = uri.substring(0, uri.indexOf('?'));

            grunt.file.mkdir('output');

            // create stream to write the download export to.
            var stream = fs.createWriteStream('output/' + exportName + '.zip');
            stream.on('close', function () {
                grunt.verbose.writeln('Done saving download ' + exportName + '.zip');
            });

            // Do the download and pipe it to the file stream.
            request({
                url: uri,
                jar: true,
                debug: options.debug
            })
                .auth(options.login, options.password, true)
                .on('response', function (response) {
                    if (response.statusCode !== 200) {
                        stream.end();
                        grunt.fail.warn('Unable to download file status ' + response.statusCode);
                        done(false);
                    }
                })
                .pipe(stream)
                .on('finish', function () {
                    grunt.log.writeln('Finished downloading');
                    done();
                });
        };

        // login into BM and start download of export
        request(
            {
                url: options.server +
                  '/on/demandware.store/Sites-Site/default/ViewSiteImpex-Status',
                jar: true,
                debug: options.debug
            }, function (error, resp, body) {
                if (!bmUtils.isLoggedIn(body)) {
                    throw 'Not able to login into business manager';
                }

                // check if export zip is available by parsing dom.
                var $ = cheerio.load(body);

                $('td').each(function () {
                    if ($(this).text().trim() === exportName + '.zip') {
                        downloadFile($(this).find('a').attr('href'));
                        return false; // break the loop
                    }
                });
            });
    });
};
