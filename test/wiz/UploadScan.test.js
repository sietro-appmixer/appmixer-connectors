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


        uploadScan.receive(context);

        // await context.stateAddToSet('entry', { a: 1 });
        // await context.stateAddToSet('entry', { a: 3 });
        // console.log(await context.stateGet('entry'));

    });

});
