const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../utils.js');
const uploadScan = require('../../src/appmixer/wiz/core/UploadScan/UploadScan.js');

describe('wiz.UploadScan', () => {

    let context;
    let mockState;
    let mockStateSet;

    beforeEach(() => {
        mockState = {};
        mockStateSet = {};

        context = {
            ...testUtils.createMockContext(),
            setTimeout: sinon.spy(),
            stateGet: sinon.stub().callsFake((key) => {
                if (mockStateSet[key] instanceof Set) {
                    return Array.from(mockStateSet[key]);
                }
                return mockState[key];
            }),
            stateSet: sinon.stub().callsFake((key, value) => { mockState[key] = value; }),
            stateUnset: sinon.stub().callsFake((key) => {
                delete mockState[key];
                if (key.startsWith('documents_')) {
                    delete mockStateSet[key];
                }
            }),
            stateAddToSet: sinon.stub().callsFake((key, value) => {
                if (!mockStateSet[key]) {
                    mockStateSet[key] = new Set();
                }
                mockStateSet[key].add(value);
            }),
            lock: sinon.stub().resolves({ unlock: sinon.stub() }),
            sendJson: sinon.stub().resolves(),
            config: {
                uploadLockRetryDelay: '3000',
                uploadLockTtl: '900000',
                uploadLockMaxRetryCount: '60'
            }
        };
    });

    it('should store documents without using lock', async () => {
        context.properties = { threshold: 5 };
        context.messages = {
            in: {
                content: {
                    document: { id: 'doc1', type: 'vulnerability', severity: 'high' },
                    filename: 'test.json',
                    integrationId: 'integration-123'
                }
            }
        };


        await context.stateAddToSet('entry', { a: 1 });
        await context.stateAddToSet('entry', { a: 3 });
        console.log(await context.stateGet('entry'));

    });

    // it('should send documents with lock when threshold is reached', async function() {
    //     this.timeout(30000);
    //
    //     context.properties = { threshold: 2 };
    //     context.messages = {
    //         in: {
    //             content: {
    //                 document: { id: 'doc2', type: 'vulnerability', severity: 'medium' },
    //                 filename: 'test.json',
    //                 integrationId: 'integration-123'
    //             }
    //         }
    //     };
    //
    //     // Pre-populate with one document to reach threshold
    //     mockState['documents_integration-123'] = [{ id: 'doc1', type: 'vulnerability', severity: 'high' }];
    //     mockState['metadata_integration-123'] = { filename: 'test.json', integrationId: 'integration-123' };
    //     mockState['active_integrations'] = ['integration-123'];
    //
    //     await uploadScan.receive(context);
    //
    //     // Verify lock was used for sending
    //     assert.equal(context.lock.callCount, 1, 'Lock should be used for sending operations');
    //     assert.ok(context.lock.getCall(0).args[0].includes('send_documents_'), 'Lock name should be specific to send operation');
    //
    //     // Verify sending occurred
    //     assert.equal(context.sendJson.callCount, 1, 'Should send when threshold reached');
    //
    //     // Verify state was cleaned up after sending
    //     assert.equal(mockState['documents_integration-123'], undefined, 'Documents should be cleared after sending');
    //     assert.equal(mockState['metadata_integration-123'], undefined, 'Metadata should be cleared after sending');
    // });

    // it('should send documents immediately when no threshold and no schedule', async function()  {
    //     this.timeout(30000);
    //
    //     context.properties = {};
    //     context.messages = {
    //         in: {
    //             content: {
    //                 document: { id: 'doc1', type: 'config', severity: 'low' },
    //                 filename: 'test.json',
    //                 integrationId: 'integration-123'
    //             }
    //         }
    //     };
    //
    //     await uploadScan.receive(context);
    //
    //     // Verify immediate sending
    //     assert.equal(context.lock.callCount, 1, 'Lock should be used for sending');
    //     assert.equal(context.sendJson.callCount, 1, 'Should send immediately when no threshold and no schedule');
    // });
    //
    // it('should handle timeout and process all active integrations', async function() {
    //     this.timeout(30000);
    //
    //     context.properties = { scheduleValue: 5, scheduleType: 'minutes' };
    //     context.messages = { timeout: {} };
    //
    //     // Setup multiple active integrations with documents
    //     mockState['active_integrations'] = ['integration-1', 'integration-2'];
    //     mockState['documents_integration-1'] = [{ id: 'doc1', type: 'vulnerability' }];
    //     mockState['documents_integration-2'] = [{ id: 'doc2', type: 'config' }];
    //     mockState['metadata_integration-1'] = { filename: 'test1.json', integrationId: 'integration-1' };
    //     mockState['metadata_integration-2'] = { filename: 'test2.json', integrationId: 'integration-2' };
    //
    //     await uploadScan.receive(context);
    //
    //     // Verify both integrations were processed
    //     assert.equal(context.lock.callCount, 2, 'Should lock for each integration');
    //     assert.equal(context.sendJson.callCount, 2, 'Should send for each integration');
    // });
    //
    // it('should calculate correct timeout for schedule drain', async () => {
    //     context.properties = {
    //         scheduleType: 'minutes',
    //         scheduleValue: 5
    //     };
    //     mockState['active_integrations'] = ['test-integration'];
    //
    //     await uploadScan.scheduleDrain(context);
    //
    //     const diff = context.setTimeout.getCall(0).args[1];
    //     const expectedSeconds = 5 * 60;
    //     const actualSeconds = Math.round(diff / 1000);
    //
    //     // Allow for small timing differences
    //     assert.ok(Math.abs(actualSeconds - expectedSeconds) <= 1,
    //         `Expected ~${expectedSeconds} seconds, got ${actualSeconds} seconds`);
    // });
    //
    // it('should not set timeout when no active integrations', async () => {
    //     context.properties = {
    //         scheduleType: 'hours',
    //         scheduleValue: 1
    //     };
    //
    //     await uploadScan.scheduleDrain(context);
    //
    //     assert.equal(context.setTimeout.callCount, 0, 'Should not set timeout when no active integrations');
    // });
    //
    // it('should throw error for invalid schedule type', async () => {
    //     context.properties = {
    //         scheduleType: 'invalid',
    //         scheduleValue: 1
    //     };
    //
    //     try {
    //         await uploadScan.scheduleDrain(context);
    //         assert.fail('Should have thrown an error for invalid schedule type');
    //     } catch (error) {
    //         assert.ok(error.message.includes('Invalid scheduleType'), 'Should throw error for invalid schedule type');
    //     }
    // });
});
