module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/index.ts',
        '!src/app.ts',
        '!src/__tests__/**',

        // Infrastructure — require live servers/filesystems to test meaningfully
        '!src/socket/**',
        '!src/middleware/multer*',

        // Type-only files — no executable code, just TypeScript interfaces/enums
        '!src/types/**',

        // Trivial/empty DTOs with no logic
        '!src/dtos/chat.dto.ts',
    ],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    moduleNameMapper: {
        "^uuid$": "<rootDir>/src/__tests__/__mocks__/uuid.js",
    },
};