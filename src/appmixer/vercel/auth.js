'use strict';

module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            accessToken: {
                type: 'text',
                name: 'Access Token',
                tooltip: 'Find your API token in your Vercel account settings under Tokens'
            }
        },

        accountNameFromProfileInfo: 'user.username',

        requestProfileInfo: async (context) => {

            const { data } = await context.httpRequest({
                method: 'GET',
                url: 'https://api.vercel.com/v2/user',
                headers: {
                    'Authorization': `Bearer ${context.accessToken}`
                }
            });
            return data;
        },

        validate: async (context) => {

            await context.httpRequest({
                method: 'GET',
                url: 'https://api.vercel.com/v2/user',
                headers: {
                    'Authorization': `Bearer ${context.accessToken}`
                }
            });
            return true;
        }
    }
};
