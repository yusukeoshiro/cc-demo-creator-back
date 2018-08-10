'use strict';

var request = require('request');
var lastCsrfToken;

/**
 *  prepends csrf detection into given callback
 */
function patchCallback(callback) {
    return function patchedCallback(error, response, body) {
        if (!error) {
            parseCsrfToken(body);
        }

        return callback.apply(request, arguments);
    };
}

/**
 *  gets CSRF token stored in business manager page chrome
 */
function parseCsrfToken(body) {
    if (!body || !body.includes('csrf_token')) {
        return;
    }

    var matches = body.match(/'csrf_token',\n'(.*)',/);

    if (matches && matches[1] && matches[1].length >= 20) {
        lastCsrfToken = matches[1];
    }
}

/**
 * Adds headers and CSRF.
 */
function addHeadersAndCSRF(options) {
    var url = require('url').parse(options.url);

    options.headers = options.headers || {};
    options.headers.Origin = url.protocol + '//' + url.hostname;
    options.url = appendCSRF(options.url);
    options.followAllRedirects = true;
}

/**
 *  if last request handled through this module carried a csrf token, it will be appended to the given URL
 */
function appendCSRF(url) {
    if (lastCsrfToken) {
        url = (url.indexOf('?') === -1) ? url + '?' : url + '&';
        url += 'csrf_token=' + lastCsrfToken;
    }

    return url;
}

/**
 *  calls csrf handler and proxies request to request modules
 */
var bmRequest = function (options, callback) {
    addHeadersAndCSRF(options);
    return request(options, patchCallback(callback));
};

/**
 *  POST csrf handling; proxies request to request modules
 */
bmRequest.post = function (options, callback) {
    addHeadersAndCSRF(options);
    return request.post(options, patchCallback(callback));
};

module.exports = bmRequest;
