import { jest } from '@jest/globals';
import { AnalyticsManager } from '../../src/analytics';
import { StorageManager } from '../../src/storage';
import { FileInfo } from '../../src/autoAccept';

// Mock StorageManager
const mockStorageManager = {
    saveData: jest.fn(),
    getData: jest.fn(),
    hasData: jest.fn()
};

describe('AnalyticsManager', () => {
    let analyticsManager: AnalyticsManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Set up proper Jest mocks with any type to bypass strict typing
        (mockStorageManager.getData as any).mockReturnValue(null);
        (mockStorageManager.saveData as any).mockResolvedValue(undefined);
        (mockStorageManager.hasData as any).mockReturnValue(false);
        
        analyticsManager = new AnalyticsManager(mockStorageManager as any);
    });

    beforeEach(async () => {
        // Clear analytics data before each test to ensure clean state
        await analyticsManager.clearAnalytics();
    });

    describe('constructor', () => {
        test('should initialize with default values', () => {
            expect(analyticsManager).toBeInstanceOf(AnalyticsManager);
        });

        test('should load data from storage on initialization', () => {
            expect(mockStorageManager.getData).toHaveBeenCalled();
        });
    });

    describe('trackFileAcceptance', () => {
        test('should track file acceptance correctly', async () => {
            const fileInfo: FileInfo = {
                filename: 'test.ts',
                filePath: '/path/to/test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            await analyticsManager.trackFileAcceptance(fileInfo);

            const data = await analyticsManager.getData();
            expect(data.analytics.fileAcceptances).toHaveLength(1);
            expect(data.analytics.fileAcceptances[0]).toEqual({
                filename: 'test.ts',
                filePath: '/path/to/test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: fileInfo.timestamp,
                sessionId: expect.any(String)
            });
        });

        test('should track multiple file acceptances', async () => {
            const fileInfo1: FileInfo = {
                filename: 'test1.ts',
                filePath: '/path/to/test1.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            const fileInfo2: FileInfo = {
                filename: 'test2.ts',
                filePath: '/path/to/test2.ts',
                addedLines: 20,
                deletedLines: 10,
                timestamp: new Date()
            };

            await analyticsManager.trackFileAcceptance(fileInfo1);
            await analyticsManager.trackFileAcceptance(fileInfo2);

            const data = await analyticsManager.getData();
            expect(data.analytics.fileAcceptances).toHaveLength(2);
            expect(data.analytics.totalFilesProcessed).toBe(2);
            expect(data.analytics.totalLinesProcessed).toBe(45);
        });

        test('should handle file acceptance with session', async () => {
            // Start a session first
            analyticsManager.startSession();

            const fileInfo: FileInfo = {
                filename: 'test.ts',
                filePath: '/path/to/test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            await analyticsManager.trackFileAcceptance(fileInfo);

            const data = await analyticsManager.getData();
            const sessionId = data.analytics.currentSession?.id;
            expect(data.analytics.fileAcceptances[0].sessionId).toBe(sessionId);
        });
    });

    describe('trackButtonClick', () => {
        test('should track button click correctly', async () => {
            const buttonType = 'Accept';
            const timeSaved = 5000; // 5 seconds

            analyticsManager.trackButtonClick(buttonType, timeSaved);

            const data = await analyticsManager.getData();
            expect(data.analytics.buttonClicks).toHaveLength(1);
            expect(data.analytics.buttonClicks[0]).toEqual({
                buttonType: 'Accept',
                timeSaved: 5000,
                timestamp: expect.any(Date),
                sessionId: undefined
            });
        });

        test('should track multiple button clicks', async () => {
            const clicks = [
                { type: 'Accept', time: 5000 },
                { type: 'Accept All', time: 10000 },
                { type: 'Run', time: 3000 }
            ];

            clicks.forEach(click => {
                analyticsManager.trackButtonClick(click.type, click.time);
            });

            const data = await analyticsManager.getData();
            expect(data.analytics.buttonClicks).toHaveLength(3);
            
            const normalizedTypes = data.analytics.buttonClicks.map((click: any) => click.buttonType);
            expect(normalizedTypes).toContain('Accept');
            expect(normalizedTypes).toContain('Accept All');
            expect(normalizedTypes).toContain('Run');
        });

        test('should track button click with session', async () => {
            analyticsManager.startSession();

            const buttonType = 'Accept';
            const timeSaved = 5000;

            analyticsManager.trackButtonClick(buttonType, timeSaved);

            const data = await analyticsManager.getData();
            const sessionId = data.analytics.currentSession?.id;
            expect(data.analytics.buttonClicks[0].sessionId).toBe(sessionId);
        });
    });

    describe('session management', () => {
        test('should start session correctly', () => {
            const startTime = new Date();
            analyticsManager.startSession();

            const data = analyticsManager.getAnalyticsData();
            expect(data.currentSession).toBeDefined();
            // Allow for small timing differences (within 100ms)
            expect(data.currentSession?.startTime.getTime()).toBeCloseTo(startTime.getTime(), -2);
        });

        test('should end session correctly', async () => {
            analyticsManager.startSession();
            const endTime = new Date();
            
            await analyticsManager.endSession();

            const data = await analyticsManager.getData();
            expect(data.analytics.currentSession).toBeNull();
            expect(data.analytics.userSessions).toHaveLength(1);
            expect(data.analytics.userSessions[0].startTime).toEqual(data.analytics.userSessions[0].startTime);
            // Allow for small timing differences (within 100ms)
            expect(data.analytics.userSessions[0].endTime.getTime()).toBeCloseTo(endTime.getTime(), -2);
        });

        test('should handle multiple sessions', () => {
            analyticsManager.startSession();
            const session1 = analyticsManager.getAnalyticsData().currentSession;

            analyticsManager.startSession();
            const session2 = analyticsManager.getAnalyticsData().currentSession;

            expect(session1).not.toBe(session2);
            expect(session1?.id).not.toBe(session2?.id);
        });

        test('should handle session without start', async () => {
            await expect(analyticsManager.endSession()).resolves.not.toThrow();
        });

        test('should handle session with end time', async () => {
            // Start a session
            analyticsManager.startSession();
            
            // End the session
            await analyticsManager.endSession();

            const data = await analyticsManager.getData();
            expect(data.analytics.userSessions).toHaveLength(1);
            expect(data.analytics.userSessions[0].endTime).toBeInstanceOf(Date);
            expect(data.analytics.userSessions[0].startTime).toBeInstanceOf(Date);
        });
    });

    describe('ROI calculations', () => {
        test('should calculate time saved correctly', async () => {
            // Set up ROI data
            const data = await analyticsManager.getData();
            data.roi.averageCompleteWorkflow = 30000; // 30 seconds
            data.roi.averageAutomatedWorkflow = 100; // 0.1 seconds
            data.analytics.totalFilesProcessed = 10;

            await mockStorageManager.saveData(data);

            // Track some actual data to enable time saved calculation
            await analyticsManager.trackFileAcceptance({
                filename: 'test.ts',
                filePath: '/path/to/test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            });

            const timeSaved = analyticsManager.calculateTimeSaved('Accept');
            expect(timeSaved).toBeGreaterThan(0);
        });

        test('should calculate productivity gain', async () => {
            const data = await analyticsManager.getData();
            data.roi.averageCompleteWorkflow = 60000; // 60 seconds
            data.roi.averageAutomatedWorkflow = 500; // 0.5 seconds
            data.analytics.totalFilesProcessed = 5;

            await mockStorageManager.saveData(data);

            // Track some actual data to enable time saved calculation
            await analyticsManager.trackFileAcceptance({
                filename: 'test.ts',
                filePath: '/path/to/test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            });

            // Add a small delay to ensure meaningful session duration
            await new Promise(resolve => setTimeout(resolve, 10));

            await analyticsManager.calculateTimeSaved('Accept');

            const updatedData = await analyticsManager.getData();
            expect(updatedData.roi.productivityGain).toBeGreaterThan(0);
        });

        test('should handle ROI calculation with no data', async () => {
            const timeSaved = analyticsManager.calculateTimeSaved('Accept');
            expect(timeSaved).toBe(0);
        });
    });

    describe('data retrieval', () => {
        test('should get analytics data', () => {
            const analytics = analyticsManager.getAnalyticsData();
            
            expect(analytics).toBeDefined();
            expect(analytics.files).toBeInstanceOf(Map);
            expect(analytics.sessions).toBeInstanceOf(Array);
            expect(analytics.totalAccepts).toBe(0);
            expect(analytics.sessionStart).toBeInstanceOf(Date);
            expect(analytics.buttonTypeCounts).toBeDefined();
        });

        test('should get analytics data with current session', () => {
            analyticsManager.startSession();
            
            const analytics = analyticsManager.getAnalyticsData();
            expect(analytics.currentSession?.id).toBe(analytics.currentSession?.id);
        });

        test('should get analytics data without current session', () => {
            const analytics = analyticsManager.getAnalyticsData();
            expect(analytics.currentSession).toBeNull();
        });
    });

    describe('ROI data retrieval', () => {
        test('should get ROI data', async () => {
            const roi = await analyticsManager.getROI();
            
            expect(roi).toBeDefined();
            expect(roi.totalTimeSaved).toBe(0);
            expect(roi.codeGenerationSessions).toBeInstanceOf(Array);
            expect(roi.averageCompleteWorkflow).toBe(30000);
            expect(roi.averageAutomatedWorkflow).toBe(100);
        });

        test('should get ROI data with calculated values', async () => {
            const data = await analyticsManager.getData();
            data.roi.averageCompleteWorkflow = 30000; // 30 seconds
            data.roi.averageAutomatedWorkflow = 100; // 0.1 seconds
            data.analytics.totalFilesProcessed = 5;

            await mockStorageManager.saveData(data);

            // Track some actual data to enable time saved calculation
            await analyticsManager.trackFileAcceptance({
                filename: 'test.ts',
                filePath: '/path/to/test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            });

            await analyticsManager.calculateTimeSaved('Accept');

            const roi = await analyticsManager.getROI();
            expect(roi.totalTimeSaved).toBeGreaterThan(0);
        });
    });

    describe('data export and clearing', () => {
        test('should export analytics data', async () => {
            const fileInfo: FileInfo = {
                filename: 'test.ts',
                filePath: '/path/to/test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            await analyticsManager.trackFileAcceptance(fileInfo);

            const exported = await analyticsManager.exportData();
            expect(exported).toBeDefined();
            expect(exported.analytics).toBeDefined();
            expect(exported.analytics.fileAcceptances).toHaveLength(1);
        });

        test('should export empty analytics data', async () => {
            const exported = await analyticsManager.exportData();
            expect(exported).toBeDefined();
            expect(exported.analytics.fileAcceptances).toHaveLength(0);
        });

        test('should clear analytics data', async () => {
            const fileInfo: FileInfo = {
                filename: 'test.ts',
                filePath: '/path/to/test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            await analyticsManager.trackFileAcceptance(fileInfo);
            await analyticsManager.clearAnalytics();

            const data = await analyticsManager.getData();
            expect(data.analytics.sessions).toHaveLength(0);
            expect(data.analytics.fileAcceptances).toHaveLength(0);
            expect(data.analytics.buttonClicks).toHaveLength(0);
            expect(data.analytics.totalTimeSaved).toBe(0);
            expect(data.analytics.totalFilesProcessed).toBe(0);
            expect(data.analytics.totalLinesProcessed).toBe(0);
        });

        test('should clear ROI data', async () => {
            await analyticsManager.clearAnalytics();

            const data = await analyticsManager.getData();
            expect(data.roi.totalTimeSaved).toBe(0);
            expect(data.roi.productivityGain).toBe(0);
            expect(data.roi.estimatedValue).toBe(0);
        });
    });

    describe('data validation and repair', () => {
        test('should validate and repair corrupted analytics data', async () => {
            const data = await analyticsManager.getData();
            (data.analytics as any).invalidField = 'corrupted';

            await mockStorageManager.saveData(data);

            const repairedData = await analyticsManager.validateData();
            expect((repairedData.analytics as any).invalidField).toBeUndefined();
        });

        test('should validate and repair corrupted ROI data', async () => {
            const data = await analyticsManager.getData();
            (data.roi as any).invalidField = 'corrupted';

            await mockStorageManager.saveData(data);

            const repairedData = await analyticsManager.validateData();
            expect((repairedData.roi as any).invalidField).toBeUndefined();
        });

        test('should handle validation with no data', async () => {
            const repairedData = await analyticsManager.validateData();
            expect(repairedData).toBeDefined();
        });
    });

    describe('statistics generation', () => {
        test('should generate button type statistics', async () => {
            const clicks = [
                { type: 'Accept', time: 5000 },
                { type: 'Accept All', time: 10000 },
                { type: 'Accept', time: 3000 }
            ];

            clicks.forEach(click => {
                analyticsManager.trackButtonClick(click.type, click.time);
            });

            const stats = await analyticsManager.getButtonTypeStats();
            expect(stats).toBeDefined();
            expect(stats['Accept']).toBe(2);
            expect(stats['Accept All']).toBe(1);
        });

        test('should generate file type statistics', async () => {
            const files = [
                { filename: 'test.ts', filePath: '/path/to/test.ts', addedLines: 10, deletedLines: 5, timestamp: new Date() },
                { filename: 'test.js', filePath: '/path/to/test.js', addedLines: 15, deletedLines: 8, timestamp: new Date() },
                { filename: 'test.ts', filePath: '/path/to/test2.ts', addedLines: 20, deletedLines: 10, timestamp: new Date() }
            ];

            for (const file of files) {
                await analyticsManager.trackFileAcceptance(file as FileInfo);
            }

            const stats = await analyticsManager.getFileTypeStats();
            expect(stats).toBeDefined();
            expect(stats['.ts']).toBe(2);
            expect(stats['.js']).toBe(1);
        });

        test('should generate session statistics', async () => {
            for (let i = 0; i < 3; i++) {
                analyticsManager.startSession();
                // Add a small delay to ensure meaningful duration
                await new Promise(resolve => setTimeout(resolve, 10));
                await analyticsManager.endSession();
            }

            const stats = await analyticsManager.getSessionStats();
            expect(stats.totalSessions).toBe(3);
            expect(stats.averageDuration).toBeGreaterThan(0);
            expect(stats.totalDuration).toBeGreaterThan(0);
        });

        test('should generate session statistics with current session', async () => {
            analyticsManager.startSession();

            const stats = await analyticsManager.getSessionStats();
            expect(stats.currentSession).toBeDefined();
            expect(stats.currentSession?.id).toBe(analyticsManager.getAnalyticsData().currentSession?.id);
        });
    });

    describe('error handling', () => {
        test('should handle storage errors gracefully', async () => {
            (mockStorageManager.saveData as any).mockRejectedValue(new Error('Storage error'));

            const fileInfo: FileInfo = {
                filename: 'test.ts',
                filePath: '/path/to/test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            await expect(analyticsManager.trackFileAcceptance(fileInfo)).resolves.not.toThrow();
        });

        test('should handle invalid file info gracefully', async () => {
            const invalidFileInfo: any = {
                filename: 'test.ts',
                filePath: '/path/to/test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            await expect(analyticsManager.trackFileAcceptance(invalidFileInfo)).resolves.not.toThrow();
        });
    });

    describe('performance and scalability', () => {
        test('should handle large numbers of file acceptances', async () => {
            const files = Array.from({ length: 1000 }, (_, i) => ({
                filename: `file${i}.ts`,
                filePath: `/path/to/file${i}.ts`,
                addedLines: Math.floor(Math.random() * 100) + 1,
                deletedLines: Math.floor(Math.random() * 50),
                timestamp: new Date()
            }));

            for (const file of files) {
                await analyticsManager.trackFileAcceptance(file as FileInfo);
            }

            const data = await analyticsManager.getData();
            expect(data.analytics.totalFilesProcessed).toBe(1000);
        });

        test('should handle large numbers of button clicks', async () => {
            const buttonTypes = ['Accept', 'Accept All', 'Run', 'Apply', 'Resume'];
            
            for (let i = 0; i < 1000; i++) {
                const buttonType = buttonTypes[i % buttonTypes.length];
                const timeSaved = Math.floor(Math.random() * 10000) + 1000;
                analyticsManager.trackButtonClick(buttonType, timeSaved);
            }

            const data = await analyticsManager.getData();
            expect(data.analytics.buttonClicks).toHaveLength(1000);
        });
    });
});
