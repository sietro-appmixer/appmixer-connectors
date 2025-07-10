'use strict';
const lib = require('../../lib');

/**
 * Component for fetching list of team members for a specific team
 * https://api.vercel.com/v2/teams/{teamId}/members
 */
module.exports = {

    async receive(context) {

        const { teamId, limit, since, until } = context.messages.in;

        if (!teamId) {
            throw new Error('Team ID is required');
        }

        const query = {};
        if (limit) query.limit = limit;
        if (since) query.since = since;
        if (until) query.until = until;

        const response = await lib.apiRequest(context, `teams/${teamId}/members`, { query });

        return context.sendJson(response.data, 'out');
    }
};
