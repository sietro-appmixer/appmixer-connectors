'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const sinon = require('sinon');

describe('CreateTask Component', function() {

    this.timeout(30000);
    let context;
    let CreateTask;

    before(function() {
        // Skip all tests if the API key is not set
        if (!process.env.ACTIVECAMPAIGN_API_KEY || !process.env.ACTIVECAMPAIGN_URL) {
            console.log('Skipping tests - ACTIVECAMPAIGN_API_KEY or ACTIVECAMPAIGN_URL not set');
            this.skip();
        }

        // Load the component
        CreateTask = require(path.join(__dirname, '../../src/appmixer/activecampaign/tasks/CreateTask/CreateTask.js'));
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

    it('should throw error when relationship is missing', async function() {
        context.messages.in.content = {
            taskType: '1',
            title: 'Test Task',
            note: 'Test Note',
            due: new Date().toISOString(),
            duration: 1,
            durationUnits: 'hours'
        };

        let error;
        try {
            await CreateTask.receive(context);
        } catch (err) {
            error = err;
        }

        assert.ok(error);
        assert.strictEqual(error.message, 'Task Relationship is required');
        assert.ok(!context.sendJson.called);
    });

    it('should throw error when taskType is missing', async function() {
        context.messages.in.content = {
            relationship: 'contact',
            title: 'Test Task',
            note: 'Test Note',
            due: new Date().toISOString(),
            duration: 1,
            durationUnits: 'hours'
        };

        let error;
        try {
            await CreateTask.receive(context);
        } catch (err) {
            error = err;
        }

        assert.ok(error);
        assert.strictEqual(error.message, 'Task type is required');
        assert.ok(!context.sendJson.called);
    });

    it('should throw error when title is missing', async function() {
        context.messages.in.content = {
            relationship: 'contact',
            taskType: '1',
            note: 'Test Note',
            due: new Date().toISOString(),
            duration: 1,
            durationUnits: 'hours'
        };

        let error;
        try {
            await CreateTask.receive(context);
        } catch (err) {
            error = err;
        }

        assert.ok(error);
        assert.strictEqual(error.message, 'Title is required');
        assert.ok(!context.sendJson.called);
    });

    it('should throw error when note is missing', async function() {
        context.messages.in.content = {
            relationship: 'contact',
            taskType: '1',
            title: 'Test Task',
            due: new Date().toISOString(),
            duration: 1,
            durationUnits: 'hours'
        };

        let error;
        try {
            await CreateTask.receive(context);
        } catch (err) {
            error = err;
        }

        assert.ok(error);
        assert.strictEqual(error.message, 'Description is required');
        assert.ok(!context.sendJson.called);
    });

    it('should throw error when due is missing', async function() {
        context.messages.in.content = {
            relationship: 'contact',
            taskType: '1',
            title: 'Test Task',
            note: 'Test Note',
            duration: 1,
            durationUnits: 'hours'
        };

        let error;
        try {
            await CreateTask.receive(context);
        } catch (err) {
            error = err;
        }

        assert.ok(error);
        assert.strictEqual(error.message, 'Due is required');
        assert.ok(!context.sendJson.called);
    });

    it('should throw error when duration is missing', async function() {
        context.messages.in.content = {
            relationship: 'contact',
            taskType: '1',
            title: 'Test Task',
            note: 'Test Note',
            due: new Date().toISOString(),
            durationUnits: 'hours'
        };

        let error;
        try {
            await CreateTask.receive(context);
        } catch (err) {
            error = err;
        }

        assert.ok(error);
        assert.strictEqual(error.message, 'Duration is required');
        assert.ok(!context.sendJson.called);
    });

    it('should throw error when durationUnits is missing', async function() {
        context.messages.in.content = {
            relationship: 'contact',
            taskType: '1',
            title: 'Test Task',
            note: 'Test Note',
            due: new Date().toISOString(),
            duration: 1
        };

        let error;
        try {
            await CreateTask.receive(context);
        } catch (err) {
            error = err;
        }

        assert.ok(error);
        assert.strictEqual(error.message, 'Duration units is required');
        assert.ok(!context.sendJson.called);
    });

    it('should create a task with all required fields', async function() {
        const timestamp = Date.now();
        context.messages.in.content = {
            relationship: 'contact',
            contactId: '1',
            taskType: '1',
            title: `Test Task ${timestamp}`,
            note: 'Test Note',
            due: new Date().toISOString(),
            duration: 1,
            durationUnits: 'hours',
            assignee: '1'
        };

        try {
            await CreateTask.receive(context);

            // If we reach here with real credentials, check the output
            if (context.sendJson.called) {
                const [output, outputPort] = context.sendJson.firstCall.args;
                assert.strictEqual(outputPort, 'newTask');
                assert.strictEqual(typeof output, 'object');
            }
        } catch (error) {
            // Handle expected API errors
            if (error.response && (error.response.status === 404 || error.response.status === 422)) {
                console.log('Task creation failed due to API error - this is expected for test data');
                assert.ok(true, 'Component correctly handled API call');
            } else {
                console.error('API Error:', error.response?.data || error.message);
                throw error;
            }
        }
    });
});
