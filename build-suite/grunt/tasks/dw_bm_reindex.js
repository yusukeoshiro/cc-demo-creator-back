'use strict';

var request = require('../lib/util/bm_request');
var cheerio = require('cheerio');
var bmUtils = require('../lib/util/dw_bm_utils');

/** Global Variable which holds the sandbox ID */
var server = '';
/** Global Variable which holds a list of site UUID */
var sites = [];

/**
 * Parses the BM Welcome page for the Sites UUIDs
 */
function parseSitesList(body) {
    var $ = cheerio.load(body);
    if (!bmUtils.isLoggedIn(body)) {
        throw 'Not able to login into business manager (parseSitesList)';
    }

    // get all links of the site switcher menu
    var result = $('#SelectedSiteID option:not([value=""])').map(function () {
        return $(this).val();
    }).get();

    return result;
}

/**
 * parses the search index page of the current sitde and passes the list of index
 * UUIDs as a return values
 */
function parseIndexList(grunt, body) {
    var $ = cheerio.load(body);

    if (!bmUtils.isLoggedIn(body)) {
        throw 'Not able to login into business manager (parseIndexList)';
    }

    grunt.verbose.writeln('Parse Index List');

    // get all UUIDs of the form on the reindexing form page
    return $('input[name=ObjectUUID]').map(function () {
        return $(this).val();
    }).get();
}

/**
 * Looks into the global variable sites. If the sites array is filled it pops a
 * value and selects the site
 */
function iterateSites(grunt, done) {
    // no site to iterate though, so we finish
    if (!sites.length) {
        done();
    }

    // get next site
    var site = sites.pop();

    request({
        url: server + '/on/demandware.store/Sites-Site/default/ViewApplication-SelectSite?SelectedSiteID=' + site,
        jar: true,
        headers: {
            'Content-Type': 'text/html'
        }
    }, function (error, resp) {
        if (resp) {
            lookupIndex(grunt, done);
        } else {
            throw ('Unable to select site ' + error);
        }
    });
}

/**
 * Looks up the Site index
 */
function lookupIndex(grunt, done) {
    grunt.verbose.writeln('Lookup Site Index');
    request({
        url: server + '/on/demandware.store/Sites-Site/default/ViewSearchIndexList_52-Start' +
        '?SelectedMenuItem=search&CurrentMenuItemId=search',
        headers: {
            'Content-Type': 'text/html'
        },
        jar: true
    }, function (error, resp, body) {
        var indexes = parseIndexList(grunt, body);

        triggerReindex(grunt, indexes, done);
    });
}

/**
 * Reguests the BM Welcome page to retrieve the list of site UUID on the top
 * left
 */
function getSitesList(grunt, url, done) {
    grunt.verbose.writeln('Get Sites List');

    request({
        url: server + '/on/demandware.store/Sites-Site/default/ViewApplication-DisplayWelcomePage',
        headers: {
            'Content-Type': 'text/html'
        },
        jar: true
    }, function (error, resp, body) {
        sites = parseSitesList(body);
        iterateSites(grunt, done);
    });
}

/**
 * Triggers the reindexing by simulating the form submit of the BM
 */
function triggerReindex(grunt, indexes, done) {
    grunt.verbose.writeln('Trigger Reindex');

    var formString,
        currentIndexUUID;

    // constructing form string as we use the same key multiple times
    formString = '';
    for (var index in indexes) {
        currentIndexUUID = indexes[index];
        formString += 'ObjectUUID=' + currentIndexUUID + '&';
        formString += 'SelectedObjectUUID=' + currentIndexUUID + '&';
    }

    formString += 'index=';

    request({
        url: server + '/on/demandware.store/Sites-Site/default/ViewSearchIndexList_52-Dispatch',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formString,
        jar: true
    }, function () {
        iterateSites(grunt, done);
    });
}

/**
 * Clicks on all Sites and reindexes them
 */
module.exports = function (grunt) {
    grunt.registerMultiTask('dw_bm_reindex', 'Business Manager Reindex of all sites', function () {
        var options = this.options(),
            done = this.async(),
            url = options.server +
            '/on/demandware.store/Sites-Site/default/ViewApplication-SelectSite';

        server = options.server;
        getSitesList(grunt, url, done, options);
    });
};
