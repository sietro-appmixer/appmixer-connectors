'use strict';

module.exports = {

    async receive(context) {

        const stores = await context.store.listStores();

        // Add metadata to help with picker functionality
        const enhancedStores = stores.map(store => ({
            ...store,
            isExisting: true
        }));

        return context.sendJson(enhancedStores, 'out');
    },

    toSelectArray(list) {

        if (!Array.isArray(list)) {
            return [];
        }

        const options = list.map(i => ({ content: i.name, value: i.storeId }));

        // Add "Create New" option at the beginning if there are stores, or as the only option if none
        options.unshift({
            content: '+ Create New Store',
            value: 'CREATE_NEW_STORE',
            action: 'create-new',
            meta: {
                isCreateOption: true
            }
        });

        return options;
    },

    toPickerArray(list) {

        if (!Array.isArray(list)) {
            return {
                stores: [],
                hasStores: false,
                createNewOption: {
                    label: 'Create New Store',
                    action: 'create-new'
                }
            };
        }

        return {
            stores: list.map(store => ({
                id: store.storeId,
                name: store.name,
                label: store.name,
                value: store.storeId
            })),
            hasStores: list.length > 0,
            createNewOption: {
                label: 'Create New Store',
                action: 'create-new'
            }
        };
    }
};
