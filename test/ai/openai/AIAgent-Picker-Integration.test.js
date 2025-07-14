const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../utils.js');

describe('AI Agent - Data Store Picker Integration', function() {

    let context;
    let listStoresComponent;
    let aiAgentComponent;

    beforeEach(function() {
        context = testUtils.createMockContext();
        listStoresComponent = require('../../../src/appmixer/utils/storage/ListStores/ListStores.js');
        aiAgentComponent = require('../../../src/appmixer/ai/openai/AIAgent/AIAgent.js');

        // Mock the lib module for AI Agent
        const lib = require('../../../src/appmixer/ai/openai/lib.js');
        sinon.stub(lib, 'sdk').returns({
            chat: {
                completions: {
                    create: sinon.stub().resolves({
                        choices: [{
                            message: { content: 'Test AI response' },
                            finish_reason: 'stop'
                        }],
                        usage: { total_tokens: 100 }
                    })
                }
            }
        });
    });

    afterEach(function() {
        sinon.restore();
    });

    describe('Complete picker workflow', function() {

        it('should provide "Create New Store" option when no stores exist', async function() {
            // Arrange - Mock empty store list
            context.store = {
                listStores: sinon.stub().resolves([])
            };
            context.messages = { in: { content: {} } };

            // Act - Get store options
            await listStoresComponent.receive(context);
            const emptyList = [];
            const options = listStoresComponent.toSelectArray(emptyList);

            // Assert
            assert.strictEqual(options.length, 1);
            assert.strictEqual(options[0].content, '+ Create New Store');
            assert.strictEqual(options[0].value, 'CREATE_NEW_STORE');
            assert.strictEqual(options[0].action, 'create-new');
        });

        it('should provide "Create New Store" option alongside existing stores', async function() {
            // Arrange - Mock existing stores
            const existingStores = [
                { name: 'Existing Store 1', storeId: 'store-1' },
                { name: 'Existing Store 2', storeId: 'store-2' }
            ];

            context.store = {
                listStores: sinon.stub().resolves(existingStores)
            };
            context.messages = { in: { content: {} } };

            // Act - Get store options
            await listStoresComponent.receive(context);
            const storeList = await context.store.listStores();
            const options = listStoresComponent.toSelectArray(storeList);

            // Assert
            assert.strictEqual(options.length, 3);
            assert.strictEqual(options[0].content, '+ Create New Store');
            assert.strictEqual(options[0].value, 'CREATE_NEW_STORE');
            assert.strictEqual(options[1].content, 'Existing Store 1');
            assert.strictEqual(options[1].value, 'store-1');
            assert.strictEqual(options[2].content, 'Existing Store 2');
            assert.strictEqual(options[2].value, 'store-2');
        });

        it('should create new store when CREATE_NEW_STORE is selected in AI Agent', async function() {
            // Arrange
            const mockNewStore = { storeId: 'auto-created-store-123' };
            context.callAppmixer = sinon.stub().resolves(mockNewStore);
            context.log = sinon.stub().resolves();
            context.sendJson = sinon.stub().resolves();
            context.stateGet = sinon.stub().resolves([]);
            context.stateSet = sinon.stub().resolves();
            context.messages = {
                in: {
                    content: {
                        prompt: 'Hello AI',
                        storeId: 'CREATE_NEW_STORE',
                        threadId: 'test-thread-123'
                    }
                }
            };
            context.properties = { model: 'gpt-4' };

            // Mock AI Agent methods
            sinon.stub(aiAgentComponent, 'publishChatProgressEvent').resolves();
            sinon.stub(aiAgentComponent, 'collectTools').resolves([]);
            sinon.stub(aiAgentComponent, 'loadSummary').resolves([]);
            sinon.stub(aiAgentComponent, 'saveSummary').resolves();
            sinon.stub(aiAgentComponent, 'saveMessages').resolves();
            sinon.stub(aiAgentComponent, 'agent').resolves({
                messages: [],
                answer: 'Hello! How can I help you?'
            });

            // Act
            await aiAgentComponent.receive(context);

            // Assert - Verify store creation was called
            assert(context.callAppmixer.calledOnce);
            const createStoreCall = context.callAppmixer.getCall(0).args[0];
            assert.strictEqual(createStoreCall.endPoint, '/stores');
            assert.strictEqual(createStoreCall.method, 'POST');
            assert(createStoreCall.body.name.startsWith('AI-Agent-Memory-'));

            // Assert - Verify store creation was logged
            assert(context.log.calledWith(sinon.match({
                step: 'created-new-store',
                storeId: 'auto-created-store-123'
            })));

            // Assert - Verify the created store was used for memory operations
            assert(aiAgentComponent.loadSummary.calledWith(context, 'auto-created-store-123', 'test-thread-123'));
        });

        it('should work normally with existing store selection', async function() {
            // Arrange
            context.callAppmixer = sinon.stub(); // Should not be called
            context.log = sinon.stub().resolves();
            context.sendJson = sinon.stub().resolves();
            context.stateGet = sinon.stub().resolves([]);
            context.stateSet = sinon.stub().resolves();
            context.messages = {
                in: {
                    content: {
                        prompt: 'Hello AI',
                        storeId: 'existing-store-456',
                        threadId: 'test-thread-123'
                    }
                }
            };
            context.properties = { model: 'gpt-4' };

            // Mock AI Agent methods
            sinon.stub(aiAgentComponent, 'publishChatProgressEvent').resolves();
            sinon.stub(aiAgentComponent, 'collectTools').resolves([]);
            sinon.stub(aiAgentComponent, 'loadSummary').resolves([]);
            sinon.stub(aiAgentComponent, 'saveSummary').resolves();
            sinon.stub(aiAgentComponent, 'saveMessages').resolves();
            sinon.stub(aiAgentComponent, 'agent').resolves({
                messages: [],
                answer: 'Hello! How can I help you?'
            });

            // Act
            await aiAgentComponent.receive(context);

            // Assert - Verify no store creation was attempted
            assert(context.callAppmixer.notCalled);

            // Assert - Verify existing store was used for memory operations
            assert(aiAgentComponent.loadSummary.calledWith(context, 'existing-store-456', 'test-thread-123'));
        });
    });
});
