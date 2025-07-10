module.exports = {
    rules: [
        {
            limit: 5000,                          // Max calls per hour
            throttling: 'window-sliding',
            window: 1000 * 60 * 60,              // 1 hour in ms
            scope: 'userId',                      // Per user limits
            resource: 'requests'                  // Resource identifier
        },
        {
            limit: 100,                           // Max 100 calls per minute
            window: 1000 * 60,                   // 1 minute
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
