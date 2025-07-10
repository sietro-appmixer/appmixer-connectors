'use strict';
const lib = require('../../lib');

/**
 * Component for fetching list of teams for the authenticated user
 * https://api.vercel.com/v2/teams
 */
module.exports = {

    async receive(context) {

        const { limit, since, until } = context.messages.in;

        const query = {};
        if (limit) query.limit = limit;
        if (since) query.since = since;
        if (until) query.until = until;

        const response = await lib.apiRequest(context, 'teams', { query });

        return context.sendJson(response.data, 'out');
    }
};
