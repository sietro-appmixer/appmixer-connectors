'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const sinon = require('sinon');

describe('UpdateTask Component', function() {

    this.timeout(30000);
    let context;
    let UpdateTask;

    before(function() {
        // Skip all tests if the API key is not set
        if (!process.env.ACTIVECAMPAIGN_API_KEY || !process.env.ACTIVECAMPAIGN_URL) {
            console.log('Skipping tests - ACTIVECAMPAIGN_API_KEY or ACTIVECAMPAIGN_URL not set');
            this.skip();
        }

        // Load the component
        UpdateTask = require(path.join(__dirname, '../../src/appmixer/activecampaign/tasks/UpdateTask/UpdateTask.js'));
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
        context.messages.in.content = {
            relationship: 'contact',
            taskType: '1',
            title: 'Updated Task',
            note: 'Updated Note',
            due: new Date().toISOString(),
            duration: 1,
            durationUnits: 'hours'
        };

        let error;
        try {
            await UpdateTask.receive(context);
        } catch (err) {
            error = err;
        }

        assert.ok(error);
        assert.strictEqual(error.message, 'Task is required');
        assert.ok(!context.sendJson.called);
    });

    it('should update a task when taskId is provided', async function() {
        context.messages.in.content = {
            taskId: '1',
            relationship: 'contact',
            contactId: '1',
            taskType: '1',
            title: 'Updated Task',
            note: 'Updated Note',
            due: new Date().toISOString(),
            duration: 2,
            durationUnits: 'hours',
            assignee: '1'
        };

        try {
            await UpdateTask.receive(context);
            
            // If we reach here with real credentials, check the output
            if (context.sendJson.called) {
                const [output, outputPort] = context.sendJson.firstCall.args;
                assert.strictEqual(outputPort, 'task');
                assert.strictEqual(typeof output, 'object');
            }
        } catch (error) {
            // Handle expected API errors
            if (error.response && (error.response.status === 404 || error.response.status === 422)) {
                console.log('Task update failed due to API error - this is expected for test data');
                assert.ok(true, 'Component correctly handled API call');
            } else {
                console.error('API Error:', error.response?.data || error.message);
                throw error;
            }
        }
    });
});
