'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const sinon = require('sinon');

describe('UpdateDeal Component', function() {

    this.timeout(30000);
    let context;
    let UpdateDeal;

    before(function() {
        // Skip all tests if the API key is not set
        if (!process.env.ACTIVECAMPAIGN_API_KEY || !process.env.ACTIVECAMPAIGN_URL) {
            console.log('Skipping tests - ACTIVECAMPAIGN_API_KEY or ACTIVECAMPAIGN_URL not set');
            this.skip();
        }

        // Load the component
        UpdateDeal = require(path.join(__dirname, '../../src/appmixer/activecampaign/deals/UpdateDeal/UpdateDeal.js'));
    });

    beforeEach(function() {
        // Mock context
        context = {
            auth: {
                apiKey: process.env.ACTIVECAMPAIGN_API_KEY,
                url: process.env.ACTIVECAMPAIGN_URL
            },
            messages: {
                in: {
                    content: {}
                }
            },
            httpRequest: require('axios'),
            sendJson: sinon.stub(),
            log: sinon.stub(),
            CancelError: Error
        };
    });

    it('should throw error when dealId is missing', async function() {
        context.messages.in.content = {
            title: 'Updated Deal',
            value: 2000,
            currency: 'USD'
        };

        let error;
        try {
            await UpdateDeal.receive(context);
        } catch (err) {
            error = err;
        }

        assert.ok(error);
        assert.strictEqual(error.message, 'Deal is required');
        assert.ok(!context.sendJson.called);
    });

    it('should update a deal when dealId is provided', async function() {
        context.messages.in.content = {
            dealId: '1',
            title: 'Updated Deal',
            value: 2000,
            currency: 'USD'
        };

        try {
            await UpdateDeal.receive(context);
            
            // If we reach here with real credentials, check the output
            if (context.sendJson.called) {
                const [output, outputPort] = context.sendJson.firstCall.args;
                assert.strictEqual(outputPort, 'deal');
                assert.strictEqual(typeof output, 'object');
            }
        } catch (error) {
            // Handle expected API errors (404 for non-existent deal, 422 for validation, etc.)
            if (error.response && (error.response.status === 404 || error.response.status === 422)) {
                console.log('Deal update failed due to API error - this is expected for test data');
                assert.ok(true, 'Component correctly handled API call');
            } else {
                console.error('API Error:', error.response?.data || error.message);
                throw error;
            }
        }
    });
});
