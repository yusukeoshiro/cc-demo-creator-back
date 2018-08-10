/**
 * Determines if a process is logged in order not.
 *
 * Usage:
 *  - Request a business manager page via the request class
 *  - Pass response body to this function to determine log in state.
 *
 * @param {string} body - Represents the html page body text.
 * @return {boolean} - result of login check
 */
function isLoggedIn(body) {
    // we must check an text element on the page to determine if we are logged in or not
    return (!body || body.indexOf('You are currently not logged in') === -1);
}

/**
 * remove all space and white spaces from string, This is used to compare demandware bm tag elements with
 * string tags which have random white spacing
 * @param {string} text - the text to remove spaces from
 * @return {String} - The formatted text
 */
function removeAllWhiteSpaces(text) {
    return (text || '').replace(/\s/g, '');
}

exports.removeAllWhiteSpaces = removeAllWhiteSpaces;
exports.isLoggedIn = isLoggedIn;
