import { jest } from '@jest/globals';

/**
 * Creates a mock MarkdownPostProcessorContext to satisfy type checking 
 * for unit tests requiring the context object passed to PaletteMRC constructor.
 */
export const createMockMarkdownPostProcessorContext = (): any => {
    return {
        sourcePath: 'test/path/to/file.md',
        getSectionInfo: jest.fn(),
        addChild: jest.fn(),
    };
}