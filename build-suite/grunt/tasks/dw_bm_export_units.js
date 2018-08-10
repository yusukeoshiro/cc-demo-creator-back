'use strict';

/**
 *  Trigger the export of business manager sites.
 *  This starts creation of an export in the business manager of the instance.
 **/
module.exports = function (grunt) {
    var qs = require('qs'),
        bmUtils = require('../lib/util/dw_bm_utils');

    /**
     * Construct POST data as a query string.
     *
     * @param {string} exportName - The name of the export
     * @param {string[]} units - Array of business manager units to export
     * @param {boolean} useRealm - Store export globally on realm?
     *
     * @return {string}
     */
    var constructForm = function (exportName, units, useRealm) {
        var postData = {
            exportFile: exportName + '.zip',
            SelectedExportUnit: units
        };

        if (useRealm) {
            postData.saveOnRealm = true;
        }

        return qs.stringify(postData, { indices: false });
    };

    /**
     * Create an array of all export units for each site.
     * @returns {string[]}
     */
    var getConfigurationUnits = function (unitsToExport, sitesToExport) {
        if (!sitesToExport) {
            grunt.fail.warn('Property "settings.siteExport.sites" must' +
            ' contain an array of sites to export.');
        }

        var units = unitsToExport.global;

        sitesToExport.forEach(function (site) {
            unitsToExport.units.forEach(function (unit) {
                units.push(unit.replace('[SITE]', site));
            });
        });

        return units;
    };

    /**
     * Callback function to check if we are on the correct ServiceExport in the body of the response.
     * When access is denied the page will not contain the string "ServiceExport"
     */
    var handleResponse = function (error, response, body) {
        if (!bmUtils.isLoggedIn(body)) {
            throw 'Not able to login into business manager';
        }
    };

    grunt.registerMultiTask('dw_bm_export_units', 'Export data units', function () {
        var options = this.options(),
            done = this.async(),
            request = require('../lib/util/bm_request');

        var exportName = grunt.option('export-name') || options.exportName || 'units_export';

        // set the generatedExportConfigName for follow up actions.
        grunt.config.set('generatedExportConfigName', exportName);

        var formUnits = getConfigurationUnits(this.data.unitsToExport, options.sitesToExport);

        request.post({
            url: options.server + '/on/demandware.store/Sites-Site/default/ViewSiteImpex-Dispatch',
            form: constructForm(exportName, formUnits, options.useRealm),
            jar: true,
            gzip: true,
            callback: handleResponse
        }, function () {
            done();
        });
    });
};
