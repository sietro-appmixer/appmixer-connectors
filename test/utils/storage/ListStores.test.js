const assert = require('assert');
const { describe, it, beforeEach } = require('mocha');

describe('utils/storage/ListStores', () => {

    let component;

    beforeEach(() => {
        component = require('../../../src/appmixer/utils/storage/ListStores/ListStores');
    });

    describe('#toSelectArray', () => {

        it('should return empty array for non-array input', () => {
            const result = component.toSelectArray(null);
            assert(Array.isArray(result));
            assert.strictEqual(result.length, 0);
        });

        it('should include "Create New" option at the beginning for empty list', () => {
            const result = component.toSelectArray([]);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].content, '+ Create New Store');
            assert.strictEqual(result[0].value, 'CREATE_NEW_STORE');
            assert.strictEqual(result[0].action, 'create-new');
        });

        it('should include "Create New" option and existing stores', () => {
            const stores = [
                { name: 'Store 1', storeId: 'store1' },
                { name: 'Store 2', storeId: 'store2' }
            ];

            const result = component.toSelectArray(stores);
            assert.strictEqual(result.length, 3);

            // First option should be "Create New"
            assert.strictEqual(result[0].content, '+ Create New Store');
            assert.strictEqual(result[0].value, 'CREATE_NEW_STORE');
            assert.strictEqual(result[0].action, 'create-new');

            // Following options should be existing stores
            assert.strictEqual(result[1].content, 'Store 1');
            assert.strictEqual(result[1].value, 'store1');
            assert.strictEqual(result[2].content, 'Store 2');
            assert.strictEqual(result[2].value, 'store2');
        });
    });

    describe('#toPickerArray', () => {

        it('should return picker config for empty list', () => {
            const result = component.toPickerArray([]);
            assert.strictEqual(result.stores.length, 0);
            assert.strictEqual(result.hasStores, false);
            assert.strictEqual(result.createNewOption.label, 'Create New Store');
            assert.strictEqual(result.createNewOption.action, 'create-new');
        });

        it('should return picker config with existing stores', () => {
            const stores = [
                { name: 'Store 1', storeId: 'store1' },
                { name: 'Store 2', storeId: 'store2' }
            ];

            const result = component.toPickerArray(stores);
            assert.strictEqual(result.stores.length, 2);
            assert.strictEqual(result.hasStores, true);

            assert.strictEqual(result.stores[0].id, 'store1');
            assert.strictEqual(result.stores[0].name, 'Store 1');
            assert.strictEqual(result.stores[1].id, 'store2');
            assert.strictEqual(result.stores[1].name, 'Store 2');

            assert.strictEqual(result.createNewOption.label, 'Create New Store');
            assert.strictEqual(result.createNewOption.action, 'create-new');
        });
    });
});
