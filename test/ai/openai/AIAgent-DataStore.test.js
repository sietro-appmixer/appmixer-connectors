const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../utils.js');

describe('ai/openai/AIAgent - Data Store Creation', function() {

    let context;
    let aiAgent;
    let libStub;

    beforeEach(function() {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };

        // Mock the lib module
        const lib = require('../../../src/appmixer/ai/openai/lib.js');
        libStub = sinon.stub(lib, 'sdk').returns({
            chat: {
                completions: {
                    create: sinon.stub().resolves({
                        choices: [{
                            message: { content: 'Test response' },
                            finish_reason: 'stop'
                        }],
                        usage: { total_tokens: 100 }
                    })
                }
            }
        });

        aiAgent = require('../../../src/appmixer/ai/openai/AIAgent/AIAgent.js');
        sinon.reset();
    });

    afterEach(function() {
        libStub.restore();
    });

    describe('automatic store creation', function() {

        beforeEach(function() {
            // Mock the required methods
            context.log = sinon.stub().resolves();
            context.sendJson = sinon.stub().resolves();
            context.callAppmixer = sinon.stub();
            context.stateGet = sinon.stub().resolves([]);
            context.stateSet = sinon.stub().resolves();

            // Mock AI Agent specific methods
            sinon.stub(aiAgent, 'publishChatProgressEvent').resolves();
            sinon.stub(aiAgent, 'collectTools').resolves([]);
            sinon.stub(aiAgent, 'loadSummary').resolves([]);
            sinon.stub(aiAgent, 'saveSummary').resolves();
            sinon.stub(aiAgent, 'saveMessages').resolves();
            sinon.stub(aiAgent, 'agent').resolves({
                messages: [],
                answer: 'Test response'
            });
        });

        afterEach(function() {
            sinon.restore();
        });

        it('should create a new store when CREATE_NEW_STORE is selected', async function() {
            // Arrange
            const mockNewStore = { storeId: 'new-store-123' };
            context.callAppmixer.resolves(mockNewStore);
            context.messages.in.content = {
                prompt: 'Test prompt',
                storeId: 'CREATE_NEW_STORE',
                threadId: 'test-thread'
            };
            context.properties = { model: 'gpt-4' };

            // Act
            await aiAgent.receive(context);

            // Assert
            assert(context.callAppmixer.calledOnce, 'callAppmixer should be called once');
            const callArgs = context.callAppmixer.getCall(0).args[0];
            assert.strictEqual(callArgs.endPoint, '/stores');
            assert.strictEqual(callArgs.method, 'POST');
            assert(callArgs.body.name.startsWith('AI-Agent-Memory-'));

            assert(context.log.calledWith(sinon.match({
                step: 'created-new-store',
                storeId: 'new-store-123'
            })));
        });

        it('should handle store creation errors gracefully', async function() {
            // Arrange
            const createError = new Error('Store creation failed');
            context.callAppmixer.rejects(createError);
            context.messages.in.content = {
                prompt: 'Test prompt',
                storeId: 'CREATE_NEW_STORE'
            };
            context.properties = { model: 'gpt-4' };

            // Act & Assert
            try {
                await aiAgent.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Failed to create new data store'));
                assert(context.log.calledWith(sinon.match({
                    step: 'create-store-error',
                    error: 'Store creation failed'
                })));
            }
        });

        it('should use existing store ID when not CREATE_NEW_STORE', async function() {
            // Arrange
            context.messages.in.content = {
                prompt: 'Test prompt',
                storeId: 'existing-store-456',
                threadId: 'test-thread'
            };
            context.properties = { model: 'gpt-4' };

            // Act
            await aiAgent.receive(context);

            // Assert
            assert(context.callAppmixer.notCalled, 'callAppmixer should not be called for existing stores');
            assert(aiAgent.loadSummary.calledWith(context, 'existing-store-456', 'test-thread'));
        });

        it('should generate unique store names based on timestamp', async function() {
            // Arrange
            const mockNewStore1 = { storeId: 'new-store-1' };
            const mockNewStore2 = { storeId: 'new-store-2' };
            context.callAppmixer.onFirstCall().resolves(mockNewStore1);
            context.callAppmixer.onSecondCall().resolves(mockNewStore2);

            context.messages.in.content = {
                prompt: 'Test prompt',
                storeId: 'CREATE_NEW_STORE'
            };
            context.properties = { model: 'gpt-4' };

            // Act - simulate two calls with a small delay
            await aiAgent.receive(context);
            await new Promise(resolve => setTimeout(resolve, 1)); // 1ms delay
            await aiAgent.receive(context);

            // Assert
            assert(context.callAppmixer.calledTwice);
            const firstCallName = context.callAppmixer.getCall(0).args[0].body.name;
            const secondCallName = context.callAppmixer.getCall(1).args[0].body.name;
            assert.notStrictEqual(firstCallName, secondCallName);
            assert(firstCallName.startsWith('AI-Agent-Memory-'));
            assert(secondCallName.startsWith('AI-Agent-Memory-'));
        });
    });
});
