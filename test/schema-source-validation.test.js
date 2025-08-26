const fs = require('fs');
const path = require('path');
const assert = require('assert');
const testUtils = require('./utils');

describe('Schema Source Validation', function() {
    let componentFiles;

    before(function() {
        // Get all component.json files recursively
        const srcDir = path.join(__dirname, '..', 'src');
        componentFiles = testUtils.getComponentJsonFiles(srcDir);
        console.log(`Found ${componentFiles.length} component.json files`);
    });

    describe('Components with generateOutputPortOptions should reference themselves in outPorts source', function() {
        let componentsWithOutputGeneration;

        before(function() {
            // Filter components that have outPorts source with generateOutputPortOptions: true
            componentsWithOutputGeneration = [];
            
            componentFiles.forEach(filePath => {
                try {
                    const componentJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    // Check if component has outPorts with source that generates dynamic output
                    if (componentJson.outPorts && Array.isArray(componentJson.outPorts)) {
                        const hasOutputGeneration = componentJson.outPorts.some(outPort => 
                            outPort && 
                            outPort.source &&
                            outPort.source.data &&
                            outPort.source.data.properties &&
                            outPort.source.data.properties.generateOutputPortOptions === true
                        );
                        
                        if (hasOutputGeneration) {
                            componentsWithOutputGeneration.push({
                                filePath,
                                componentJson
                            });
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to parse ${filePath}:`, error.message);
                }
            });
            
            console.log(`Found ${componentsWithOutputGeneration.length} components with generateOutputPortOptions: true in outPorts source`);
        });

        it('should reference themselves in outPorts source URLs when generating dynamic output schemas', function() {
            const invalidComponents = [];
            
            componentsWithOutputGeneration.forEach(({ filePath, componentJson }) => {
                const componentName = componentJson.name;
                if (!componentName) {
                    console.warn(`Component at ${filePath} has no name field`);
                    return;
                }
                
                // Extract expected URL path from component name
                // e.g., "appmixer.googleChat.core.FindMessages" -> "/component/appmixer/googleChat/core/FindMessages"
                const nameParts = componentName.split('.');
                if (nameParts.length < 4) {
                    console.warn(`Component ${componentName} has unexpected name format`);
                    return;
                }
                
                const expectedUrlPath = `/component/${nameParts.join('/')}`;
                
                // Check all outPorts with source that have generateOutputPortOptions
                componentJson.outPorts.forEach((outPort, outPortIndex) => {
                    if (outPort && 
                        outPort.source && 
                        outPort.source.url &&
                        outPort.source.data &&
                        outPort.source.data.properties &&
                        outPort.source.data.properties.generateOutputPortOptions === true) {
                        
                        const sourceUrl = outPort.source.url;
                        
                        // Extract the component path from the source URL
                        // e.g., "/component/appmixer/googleChat/core/FindMessages?outPort=out" -> "/component/appmixer/googleChat/core/FindMessages"
                        const urlWithoutQueryParams = sourceUrl.split('?')[0];
                        
                        if (urlWithoutQueryParams !== expectedUrlPath) {
                            invalidComponents.push({
                                componentName,
                                filePath,
                                outPortName: outPort.name || `outPort[${outPortIndex}]`,
                                expectedUrl: expectedUrlPath,
                                actualUrl: urlWithoutQueryParams,
                                fullSourceUrl: sourceUrl
                            });
                        }
                    }
                });
            });
            
            if (invalidComponents.length > 0) {
                const errorMessage = invalidComponents.map(component => 
                    `Component "${component.componentName}" (${component.filePath}) has invalid source URL in outPort "${component.outPortName}":\n` +
                    `  Expected: ${component.expectedUrl}\n` +
                    `  Actual: ${component.actualUrl}\n` +
                    `  Full URL: ${component.fullSourceUrl}\n` +
                    `  Issue: Components with generateOutputPortOptions should reference themselves for dynamic schema generation.`
                ).join('\n\n');
                
                assert.fail(`Found ${invalidComponents.length} component(s) with invalid outPort source URLs:\n\n${errorMessage}`);
            }
        });
        
        it('should have at least one component with generateOutputPortOptions to validate the test is working', function() {
            assert(componentsWithOutputGeneration.length > 0, 'Expected to find at least one component with generateOutputPortOptions: true in outPorts');
        });
    });
});