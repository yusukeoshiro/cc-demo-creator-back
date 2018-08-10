'use strict';

var cheerio = require('cheerio'),
    moment = require('moment'),
    _ = require('underscore'),
    bmUtils = require('./dw_bm_utils');

/**
 * Parse the start date of an import job.
 * The date is rendered in the HTML as 7/21/15 10:19:13 am,
 * but the space between year and hour can be actually a '&nbsp;'.
 *
 * Returns an array with the date time components in the order:
 * year, month, day, hour, minute, second.
 */
function parseStartDate(startDate) {
    var regex = /(\d+)\/(\d+)\/(\d+)[\s\S]+?(\d+):(\d+):(\d+) (\w+)/;
    var match = regex.exec(startDate);
    if (!match) {
        return null;
    }

    return [

        // year + 2000
        2000 + parseInt(match[3], 10),

        // month - 1 because in javascript month is zero-based index
        parseInt(match[1], 10) - 1,

        // day
        parseInt(match[2], 10),

        // hour + 12 if pm
        parseInt(match[4], 10) + (match[7] === 'pm' ? 12 : 0),

        // minute
        parseInt(match[5], 10),

        // seconds
        parseInt(match[6], 10)
    ];
}

/**
 * Parses the data errors string to determine how many data errors, if any, existed.
 * This string is something like 'Finished (1 data errors)'.
 */
function parseDataErrors(status) {
    var regex = /(\d+) data errors/;
    var match = regex.exec(status);
    if (!match) {
        return 0;
    }

    return parseInt(match[1], 10);
}

/**
 * Parses the HTML of a table row that shows an import job.
 * Returns an object that contains the fields:
 * - name: the name of the job
 * - start: the date when the job was started as a string in a sortable format
 * - duration: the duration of the job
 * - status: the status of the job
 * - isRunning: true if the job is still running
 * - isFinished: true if the job has executed
 * - isError: true if the job had failed
 * - dataErrors: the number of data errors in the job
 */
function parseRow($, $row) {
    var $cells = $row.find('td');

    // has to be 5 columns otherwise it's not what we're looking for
    if (!$cells || $cells.length !== 5) {
        return null;
    }

    /**
   * Small utility function to get the (trimmed) text of a table cell.
   */
    var cellText = function (index) {
        var $cell = $($cells.get(index));
        return $cell.text().trim();
    };

    // get the start date as a text 7/21/15 10:19:13 am
    var startAsText = cellText(2);

    // parse it into an array of its components
    var startAsArray = parseStartDate(startAsText);

    // create a moment instance
    var startAsMoment = moment(startAsArray);

    // format it into a sortable string (2015-07-21T10:19:13)
    var startAsSortableText = startAsMoment.format('YYYY-MM-DDTHH:mm:ss');

    var name = cellText(1),
        duration = cellText(3),
        status = cellText(4);

    return {
        name: name,
        start: startAsSortableText,
        duration: duration,
        status: status,
        isRunning: status === 'Running',
        isFinished: status.indexOf('Finished') === 0 || status.indexOf('Success') === 0 ||
        status.indexOf('Error') === 0,
        isError: status.indexOf('Error') === 0,
        dataErrors: parseDataErrors(status)
    };
}

/**
 * Parses the HTML table containing the import jobs.
 * Returns an array of objects describing the jobs.
 */
function parseTable($, $table) {
    return $table.find('tr').map(function () {
        return parseRow($, $(this));
    });
}

/**
 * Filters out records and keeps only the ones with the desired name.
 */
function filterRecords(records, options) {
    if (!options.archiveName) {
        throw 'Archive name was not provided';
    }

    if (!options.processLabel) {
        throw 'Archive label not provided';
    }

    var textToFind = bmUtils.removeAllWhiteSpaces(
        options.processLabel.replace('{0}', options.archiveName)
    );
    return _.filter(records, function (record) {
        return bmUtils.removeAllWhiteSpaces(record.name) === textToFind;
    });
}

/**
 * Parses the HTML body to find the import jobs of the desired name.
 * The most recently created job is returned.
 */
function parseBody(body, options) {
    if (!bmUtils.isLoggedIn(body)) {
        throw 'Not able to login into business manager';
    }

    if (!options.selector) {
        throw 'Unable to retrieve process element, no selector defined';
    }

    // check if export zip is available by parsing dom.
    var $ = cheerio.load(body),
        $table = $(options.selector);

    // sort by start date and pick the last record
    return _.last(
        _.sortBy(
            filterRecords(
                parseTable($, $table),
                options),
            'start'));
}

module.exports.parseBody = parseBody;
