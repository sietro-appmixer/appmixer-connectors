'use strict';

/**
 * Makes an authenticated request to the Vercel API
 * @param {Object} context - Appmixer context object containing auth info
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Additional request options
 * @returns {Promise<Object>} - API response
 */
async function apiRequest(context, endpoint, options = {}) {

    const { method = 'GET', query = {}, data } = options;

    const requestOptions = {
        method,
        url: `https://api.vercel.com/v2/${endpoint}`,
        headers: {
            'Authorization': `Bearer ${context.auth.accessToken}`,
            'Content-Type': 'application/json'
        }
    };

    if (Object.keys(query).length > 0) {
        requestOptions.params = query;
    }

    if (data) {
        requestOptions.data = data;
    }

    const response = await context.httpRequest(requestOptions);
    return response;
}

module.exports = {
    apiRequest
};
