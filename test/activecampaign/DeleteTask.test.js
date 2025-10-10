'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const sinon = require('sinon');

describe('DeleteTask Component', function() {

    this.timeout(30000);
    let context;
    let DeleteTask;

    before(function() {
        // Skip all tests if the API key is not set
        if (!process.env.ACTIVECAMPAIGN_API_KEY || !process.env.ACTIVECAMPAIGN_URL) {
            console.log('Skipping tests - ACTIVECAMPAIGN_API_KEY or ACTIVECAMPAIGN_URL not set');
            this.skip();
        }

        // Load the component
        DeleteTask = require(path.join(__dirname, '../../src/appmixer/activecampaign/tasks/DeleteTask/DeleteTask.js'));
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

    it('should throw error when taskId is missing', async function() {
        context.messages.in.content = {};

        let error;
        try {
            await DeleteTask.receive(context);
        } catch (err) {
            error = err;
        }

        assert.ok(error);
        assert.strictEqual(error.message, 'Task is required');
        assert.ok(!context.sendJson.called);
    });

    it('should delete a task when taskId is provided', async function() {
        context.messages.in.content = {
            taskId: '999999' // Non-existent ID to avoid deleting real data
        };

        try {
            await DeleteTask.receive(context);
            
            // Even if the task doesn't exist, the component should return success
            assert.ok(context.sendJson.calledOnce);
            const [output, outputPort] = context.sendJson.firstCall.args;
            assert.strictEqual(outputPort, 'out');
            assert.strictEqual(output.taskId, '999999');
        } catch (error) {
            // Should not throw error even for 404
            console.error('Unexpected error:', error.response?.data || error.message);
            throw error;
        }
    });
});
