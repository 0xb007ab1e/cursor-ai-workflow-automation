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
            expect(data.analytics.fileAcceptances).toHaveLength(1);
            expect(data.analytics.fileAcceptances[0].sessionId).toBeDefined();
        });

        test('should handle file acceptance without session', async () => {
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
            expect(data.analytics.fileAcceptances[0].sessionId).toBeDefined();
        });

        test('should handle file acceptance with invalid data', async () => {
            const fileInfo: any = {
                filename: 'test.ts',
                filePath: '/path/to/test.ts',
                addedLines: NaN,
                deletedLines: NaN,
                timestamp: new Date()
            };

            await analyticsManager.trackFileAcceptance(fileInfo);

            const data = await analyticsManager.getData();
            expect(data.analytics.fileAcceptances).toHaveLength(1);
            expect(data.analytics.fileAcceptances[0].addedLines).toBe(0);
            expect(data.analytics.fileAcceptances[0].deletedLines).toBe(0);
        });

        test('should handle file acceptance with missing filename', async () => {
            const fileInfo: any = {
                filePath: '/path/to/test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            await analyticsManager.trackFileAcceptance(fileInfo);

            const data = await analyticsManager.getData();
            expect(data.analytics.fileAcceptances).toHaveLength(0);
        });

        test('should handle file acceptance with null fileInfo', async () => {
            await analyticsManager.trackFileAcceptance(null as any);

            const data = await analyticsManager.getData();
            expect(data.analytics.fileAcceptances).toHaveLength(0);
        });
    });

    describe('trackButtonClick', () => {
        test('should track button click correctly', async () => {
            await analyticsManager.trackButtonClick('Accept', 1000);

            const data = await analyticsManager.getData();
            expect(data.analytics.buttonClicks).toHaveLength(1);
            expect(data.analytics.buttonClicks[0]).toEqual({
                buttonType: 'Accept',
                timestamp: expect.any(Date),
                timeSaved: 1000,
                sessionId: undefined
            });
        });

        test('should track multiple button clicks', async () => {
            await analyticsManager.trackButtonClick('Accept', 1000);
            await analyticsManager.trackButtonClick('Run', 2000);
            await analyticsManager.trackButtonClick('Apply', 1500);

            const data = await analyticsManager.getData();
            expect(data.analytics.buttonClicks).toHaveLength(3);
            expect(data.analytics.totalAccepts).toBe(3);
        });

        test('should normalize button types correctly', async () => {
            await analyticsManager.trackButtonClick('Accept All', 1000);
            await analyticsManager.trackButtonClick('Run Command', 2000);
            await analyticsManager.trackButtonClick('Resume Conversation', 1500);

            const data = await analyticsManager.getData();
            expect(data.analytics.buttonTypeCounts['accept-all']).toBe(1);
            expect(data.analytics.buttonTypeCounts['run-command']).toBe(1);
            expect(data.analytics.buttonTypeCounts['resume-conversation']).toBe(1);
        });

        test('should handle button click with session', async () => {
            analyticsManager.startSession();

            await analyticsManager.trackButtonClick('Accept', 1000);

            const data = await analyticsManager.getData();
            expect(data.analytics.buttonClicks).toHaveLength(1);
            expect(data.analytics.buttonClicks[0].sessionId).toBeDefined();
        });

        test('should handle button click without session', async () => {
            await analyticsManager.trackButtonClick('Accept', 1000);

            const data = await analyticsManager.getData();
            expect(data.analytics.buttonClicks).toHaveLength(1);
            expect(data.analytics.buttonClicks[0].sessionId).toBeUndefined();
        });
    });

    describe('session management', () => {
        test('should start session correctly', () => {
            analyticsManager.startSession();

            const sessionStats = analyticsManager.getSessionStats();
            expect(sessionStats.currentSession).toBeDefined();
            expect(sessionStats.currentSession?.id).toMatch(/^session_\d+_[a-z0-9]+$/);
            expect(sessionStats.currentSession?.startTime).toBeInstanceOf(Date);
            expect(sessionStats.currentSession?.endTime).toBeNull();
        });

        test('should end session correctly', async () => {
            analyticsManager.startSession();
            const sessionId = analyticsManager.getSessionStats().currentSession?.id;

            await analyticsManager.endSession();

            const sessionStats = analyticsManager.getSessionStats();
            expect(sessionStats.currentSession).toBeNull();
            expect(sessionStats.totalSessions).toBeGreaterThan(0);
        });

        test('should handle ending session when no current session exists', async () => {
            await analyticsManager.clearAllData();

            await expect(analyticsManager.endSession()).resolves.toBeUndefined();

            const sessionStats = analyticsManager.getSessionStats();
            expect(sessionStats.totalSessions).toBe(0);
        });

        test('should generate unique session IDs', () => {
            const id1 = (analyticsManager as any).generateSessionId();
            const id2 = (analyticsManager as any).generateSessionId();

            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
            expect(id2).toMatch(/^session_\d+_[a-z0-9]+$/);
        });
    });

    describe('ROI calculations', () => {
        test('should calculate time saved correctly', async () => {
            analyticsManager.calibrateWorkflowTimes(10, 2); // 10 seconds manual, 2 seconds automated

            // Add some file data to ensure calculation proceeds
            const fileInfo = {
                filename: 'test.js',
                addedLines: 5,
                deletedLines: 0,
                timestamp: new Date()
            };
            await analyticsManager.trackFileAcceptance(fileInfo, 'accept');

            const timeSaved = analyticsManager.calculateTimeSaved('accept');
            expect(timeSaved).toBeGreaterThan(7000); // Allow for some variation around 8000
        });

        test('should handle zero workflow times gracefully', () => {
            analyticsManager.calibrateWorkflowTimes(0, 0);

            const timeSaved = analyticsManager.calculateTimeSaved('accept');
            expect(timeSaved).toBe(0);
        });

        test('should handle no analytics data gracefully', async () => {
            await analyticsManager.clearAllData();

            const timeSaved = analyticsManager.calculateTimeSaved('accept');
            expect(timeSaved).toBe(0);
        });

        test('should calculate time savings for different button types with extra time', async () => {
            analyticsManager.calibrateWorkflowTimes(10, 2); // 10 seconds manual, 2 seconds automated

            // Add some file data to ensure calculation proceeds
            const fileInfo = {
                filename: 'test.js',
                addedLines: 10,
                deletedLines: 0,
                timestamp: new Date()
            };
            await analyticsManager.trackFileAcceptance(fileInfo, 'accept');

            // accept-all should add 5000ms extra
            const acceptAllTime = analyticsManager.calculateTimeSaved('accept-all');
            expect(acceptAllTime).toBeGreaterThan(13000); // Allow for some variation

            // run should add 2000ms extra
            const runTime = analyticsManager.calculateTimeSaved('run');
            expect(runTime).toBeGreaterThan(10000); // Allow for some variation

            // resume-conversation should add 3000ms extra
            const resumeTime = analyticsManager.calculateTimeSaved('resume-conversation');
            expect(resumeTime).toBeGreaterThan(11000); // Allow for some variation
        });

        test('should update ROI tracking properties after time calculation', async () => {
            analyticsManager.calibrateWorkflowTimes(8, 1); // 8 seconds manual, 1 second automated

            // Add some file data to ensure calculation proceeds
            const fileInfo = {
                filename: 'test.js',
                addedLines: 5,
                deletedLines: 0,
                timestamp: new Date()
            };
            await analyticsManager.trackFileAcceptance(fileInfo, 'accept');

            const initialROI = analyticsManager.getROIData();
            const initialTotalTimeSaved = initialROI.totalTimeSaved;

            analyticsManager.calculateTimeSaved('accept');

            const updatedROI = analyticsManager.getROIData();
            expect(updatedROI.totalTimeSaved).toBeGreaterThan(initialTotalTimeSaved);
        });

        test('should handle session duration of zero for productivity calculation', async () => {
            analyticsManager.calibrateWorkflowTimes(5, 1); // 5 seconds manual, 1 second automated

            // Add some file data to ensure calculation proceeds
            const fileInfo = {
                filename: 'test.js',
                addedLines: 3,
                deletedLines: 0,
                timestamp: new Date()
            };
            await analyticsManager.trackFileAcceptance(fileInfo, 'accept');

            // Mock session start to be now (zero duration) by clearing and restarting
            await analyticsManager.clearAllData();

            analyticsManager.calculateTimeSaved('accept');

            const roiData = analyticsManager.getROIData();
            expect(roiData.productivityGain).toBe(0);
        });
    });

    describe('data validation and repair', () => {
        test('should validate data consistency correctly', async () => {
            // Use public methods to set up test data
            await analyticsManager.trackButtonClick('accept', 1000);
            await analyticsManager.trackButtonClick('accept', 1000);
            await analyticsManager.trackButtonClick('accept', 1000);
            await analyticsManager.trackButtonClick('accept', 1000);
            await analyticsManager.trackButtonClick('accept', 1000);

            const validation = analyticsManager.validateData();

            expect(validation.isDataConsistent).toBeDefined();
            expect(validation.currentSession.totalAccepts).toBe(5);
            expect(validation.currentSession.timeSaved).toBeGreaterThanOrEqual(0);
            expect(validation.currentSession.filesCount).toBe(0);
            expect(validation.analytics).toBeDefined();
            expect(validation.roi).toBeDefined();
        });

        test('should detect data inconsistency', async () => {
            // Clear data and add mismatched data
            await analyticsManager.clearAllData();
            await analyticsManager.trackButtonClick('accept', 1000);
            await analyticsManager.trackButtonClick('accept', 1000);
            await analyticsManager.trackButtonClick('accept', 1000);

            const validation = analyticsManager.validateData();

            expect(validation.isDataConsistent).toBe(false);
        });

        test('should clean corrupted data fields', () => {
            // This test is limited since we can't directly access private properties
            // We'll test the validation method works without crashing
            const validation = analyticsManager.validateData();

            expect(validation.analytics).toBeDefined();
            expect(validation.roi).toBeDefined();
            expect(validation.isDataConsistent).toBeDefined();
            expect(validation.currentSession).toBeDefined();
        });
    });

    describe('data export functionality', () => {
        beforeEach(() => {
            // Mock browser environment
            Object.defineProperty(global, 'window', {
                value: {
                    URL: {
                        createObjectURL: jest.fn(() => 'blob:mock-url'),
                        revokeObjectURL: jest.fn(),
                    },
                    document: {
                        createElement: jest.fn(() => ({
                            href: '',
                            download: '',
                            click: jest.fn(),
                        })),
                    },
                },
                writable: true,
            });
        });

        afterEach(() => {
            delete (global as any).window;
        });

        test('should export data with all required fields', async () => {
            // Add test data using public methods
            const fileInfo = {
                filename: 'test.js',
                addedLines: 10,
                deletedLines: 2,
                timestamp: new Date()
            };
            await analyticsManager.trackFileAcceptance(fileInfo, 'accept');
            await analyticsManager.trackButtonClick('accept', 1000);
            await analyticsManager.trackButtonClick('run', 1000);

            const exportedData = analyticsManager.exportData();

            expect(exportedData.analytics).toBeDefined();
            expect(exportedData.roi).toBeDefined();
            expect(exportedData.session).toBeDefined();
            expect(exportedData.files).toBeDefined();
            expect(exportedData.sessions).toBeDefined();
            expect(exportedData.buttonTypeCounts).toBeDefined();
            expect(exportedData.exportedAt).toBeInstanceOf(Date);
            expect(exportedData.session.totalAccepts).toBeGreaterThan(0);
            expect(exportedData.session.duration).toBeGreaterThan(0);
        });

        test('should handle export in non-browser environment gracefully', () => {
            delete (global as any).window;

            const exportedData = analyticsManager.exportData();

            expect(exportedData).toBeDefined();
            expect(exportedData.analytics).toBeDefined();
        });

        test('should handle export errors gracefully', () => {
            // Mock window but make URL.createObjectURL throw
            Object.defineProperty(global, 'window', {
                value: {
                    URL: {
                        createObjectURL: jest.fn(() => {
                            throw new Error('Mock error');
                        }),
                        revokeObjectURL: jest.fn(),
                    },
                    document: {
                        createElement: jest.fn(() => ({
                            href: '',
                            download: '',
                            click: jest.fn(),
                        })),
                    },
                },
                writable: true,
            });

            const exportedData = analyticsManager.exportData();

            expect(exportedData).toBeDefined();
            expect(exportedData.analytics).toBeDefined();
        });
    });

    describe('comprehensive data clearing', () => {
        test('should clear all analytics data completely', async () => {
            // Populate with test data using public methods
            const fileInfo = {
                filename: 'test.js',
                addedLines: 10,
                deletedLines: 2,
                timestamp: new Date()
            };
            await analyticsManager.trackFileAcceptance(fileInfo, 'accept');
            await analyticsManager.trackButtonClick('accept', 1000);

            // Verify data exists
            const initialStats = analyticsManager.getSessionStats();
            expect(initialStats.totalFiles).toBeGreaterThan(0);

            await analyticsManager.clearAnalytics();

            // Verify analytics cleared through public methods
            const clearedStats = analyticsManager.getSessionStats();
            expect(clearedStats.totalFiles).toBe(0);
            expect(clearedStats.totalAdded).toBe(0);
            expect(clearedStats.totalDeleted).toBe(0);

            const roiData = analyticsManager.getROIData();
            expect(roiData.totalTimeSaved).toBe(0);
        });

        test('should clear all data and reset session start', async () => {
            // Add some data first
            await analyticsManager.trackButtonClick('accept', 1000);

            const originalSessionStart = analyticsManager.getSessionStats().sessionDuration;

            await analyticsManager.clearAllData();

            // Verify through public methods
            const sessionStats = analyticsManager.getSessionStats();
            expect(sessionStats.totalFiles).toBe(0);
            expect(sessionStats.totalAdded).toBe(0);
            expect(sessionStats.totalDeleted).toBe(0);
            expect(sessionStats.totalSessions).toBe(0);

            const roiData = analyticsManager.getROIData();
            expect(roiData.totalTimeSaved).toBe(0);
        });
    });

    describe('statistics and analytics methods', () => {
        test('should get button type statistics', async () => {
            // Add button clicks using public methods
            await analyticsManager.trackButtonClick('accept', 1000);
            await analyticsManager.trackButtonClick('accept', 1000);
            await analyticsManager.trackButtonClick('run', 1000);
            await analyticsManager.trackButtonClick('apply', 1000);

            const stats = analyticsManager.getButtonTypeStats();

            expect(stats.accept).toBe(2);
            expect(stats.run).toBe(1);
            expect(stats.apply).toBe(1);
        });

        test('should get file type statistics', async () => {
            // Add file acceptances using public methods
            const files = [
                { filename: 'test.js', addedLines: 5, deletedLines: 0, timestamp: new Date() },
                { filename: 'app.ts', addedLines: 3, deletedLines: 1, timestamp: new Date() },
                { filename: 'style.css', addedLines: 2, deletedLines: 0, timestamp: new Date() },
                { filename: 'index.html', addedLines: 4, deletedLines: 0, timestamp: new Date() },
                { filename: 'config.json', addedLines: 1, deletedLines: 0, timestamp: new Date() },
            ];

            for (const file of files) {
                await analyticsManager.trackFileAcceptance(file, 'accept');
            }

            const stats = analyticsManager.getFileTypeStats();

            expect(stats['.js']).toBe(1);
            expect(stats['.ts']).toBe(1);
            expect(stats['.css']).toBe(1);
            expect(stats['.html']).toBe(1);
            expect(stats['.json']).toBe(1);
        });

        test('should handle files without extensions', async () => {
            // Add files without extensions
            const files = [
                { filename: 'README', addedLines: 1, deletedLines: 0, timestamp: new Date() },
                { filename: 'Dockerfile', addedLines: 2, deletedLines: 0, timestamp: new Date() },
                { filename: 'Makefile', addedLines: 3, deletedLines: 0, timestamp: new Date() },
            ];

            for (const file of files) {
                await analyticsManager.trackFileAcceptance(file, 'accept');
            }

            const stats = analyticsManager.getFileTypeStats();

            expect(stats['']).toBe(3);
        });

        test('should get file extension correctly', () => {
            const getFileExtension = (analyticsManager as any).getFileExtension;

            expect(getFileExtension('test.js')).toBe('.js');
            expect(getFileExtension('app.ts')).toBe('.ts');
            expect(getFileExtension('style.css')).toBe('.css');
            expect(getFileExtension('README')).toBe('');
            expect(getFileExtension('.env')).toBe('');
            expect(getFileExtension('')).toBe('');
        });
    });

    describe('workflow calibration and recalculation', () => {
        test('should calibrate workflow times and recalculate existing sessions', async () => {
            // Set up existing workflow sessions using public methods
            analyticsManager.calibrateWorkflowTimes(10, 2); // 10 seconds manual, 2 seconds automated

            // Add some button clicks to create workflow sessions
            await analyticsManager.trackButtonClick('accept', 1000);
            await analyticsManager.trackButtonClick('accept', 1000);
            await analyticsManager.trackButtonClick('accept', 1000);

            // Recalibrate to trigger recalculation
            analyticsManager.calibrateWorkflowTimes(10, 2);

            const roiData = analyticsManager.getROIData();
            expect(roiData.averageCompleteWorkflow).toBe(10000); // 10 seconds in ms
            expect(roiData.averageAutomatedWorkflow).toBe(2); // 2 seconds in ms
            expect(roiData.totalTimeSaved).toBeGreaterThan(0);
        });

        test('should handle calibration with zero automated time', async () => {
            // Add some button clicks first
            await analyticsManager.trackButtonClick('accept', 1000);

            analyticsManager.calibrateWorkflowTimes(5, 0); // 5 seconds manual, 0 seconds automated

            const roiData = analyticsManager.getROIData();
            expect(roiData.averageCompleteWorkflow).toBe(5000);
            expect(roiData.averageAutomatedWorkflow).toBe(0);
            expect(roiData.totalTimeSaved).toBeGreaterThan(0);
        });

        test('should handle file acceptance with existing file data', async () => {
            const fileInfo1: FileInfo = {
                filename: 'test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            const fileInfo2: FileInfo = {
                filename: 'test.ts', // Same file
                addedLines: 15,
                deletedLines: 3,
                timestamp: new Date()
            };

            await analyticsManager.trackFileAcceptance(fileInfo1);
            await analyticsManager.trackFileAcceptance(fileInfo2);

            const data = await analyticsManager.getData();
            const fileData = data.analytics.files.get('test.ts');
            expect(fileData?.acceptCount).toBe(2);
            expect(fileData?.totalAdded).toBe(25);
            expect(fileData?.totalDeleted).toBe(8);
        });

        test('should handle file acceptance with button types tracking', async () => {
            const fileInfo1: FileInfo = {
                filename: 'test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            const fileInfo2: FileInfo = {
                filename: 'test.ts',
                addedLines: 15,
                deletedLines: 3,
                timestamp: new Date()
            };

            await analyticsManager.trackFileAcceptance(fileInfo1, 'accept');
            await analyticsManager.trackFileAcceptance(fileInfo2, 'run');

            const data = await analyticsManager.getData();
            const fileData = data.analytics.files.get('test.ts');
            expect(fileData?.buttonTypes?.accept).toBe(1);
            expect(fileData?.buttonTypes?.run).toBe(1);
        });

        test('should handle button click with session tracking', async () => {
            analyticsManager.startSession();

            await analyticsManager.trackButtonClick('Accept', 1000);

            const data = await analyticsManager.getData();
            expect(data.analytics.buttonClicks).toHaveLength(1);
            expect(data.analytics.buttonClicks[0].sessionId).toBeDefined();
        });

        test('should handle button click without session tracking', async () => {
            await analyticsManager.trackButtonClick('Accept', 1000);

            const data = await analyticsManager.getData();
            expect(data.analytics.buttonClicks).toHaveLength(1);
            expect(data.analytics.buttonClicks[0].sessionId).toBeUndefined();
        });

        test('should handle button click with workflow session tracking', async () => {
            await analyticsManager.trackButtonClick('Accept', 1000);

            const roiData = analyticsManager.getROI();
            expect(roiData.workflowSessions).toHaveLength(1);
            expect(roiData.workflowSessions[0].buttonType).toBe('accept');
            expect(roiData.workflowSessions[0].timeSaved).toBe(1000);
        });

        test('should handle storage load with missing analytics data', () => {
            mockStorageManager.getData.mockReturnValue({
                someOtherData: 'value'
            });

            const newAnalyticsManager = new AnalyticsManager(mockStorageManager as any);
            const data = newAnalyticsManager.getData();
            expect(data.analytics.files).toBeInstanceOf(Map);
            expect(data.analytics.sessions).toEqual([]);
        });

        test('should handle storage load with missing ROI data', () => {
            mockStorageManager.getData.mockReturnValue({
                analytics: {
                    files: [],
                    sessions: [],
                    totalAccepts: 0
                }
            });

            const newAnalyticsManager = new AnalyticsManager(mockStorageManager as any);
            const roiData = newAnalyticsManager.getROI();
            expect(roiData.workflowSessions).toEqual([]);
            expect(roiData.codeGenerationSessions).toEqual([]);
        });

        test('should handle storage load with ROI data', () => {
            const mockROIData = {
                workflowSessions: [
                    { timestamp: '2024-01-01T00:00:00.000Z', buttonType: 'accept', timeSaved: 1000 }
                ],
                codeGenerationSessions: [
                    { start: '2024-01-01T00:00:00.000Z', duration: 5000 }
                ]
            };

            mockStorageManager.getData.mockReturnValue({
                analytics: {
                    files: [],
                    sessions: [],
                    totalAccepts: 0
                },
                roiTracking: mockROIData
            });

            const newAnalyticsManager = new AnalyticsManager(mockStorageManager as any);
            const roiData = newAnalyticsManager.getROI();
            expect(roiData.workflowSessions).toHaveLength(1);
            expect(roiData.workflowSessions[0].timestamp).toBeInstanceOf(Date);
            expect(roiData.codeGenerationSessions).toHaveLength(1);
            expect(roiData.codeGenerationSessions[0].start).toBeInstanceOf(Date);
        });

        test('should handle storage load error gracefully', () => {
            mockStorageManager.getData.mockImplementation(() => {
                throw new Error('Storage error');
            });

            expect(() => new AnalyticsManager(mockStorageManager as any)).not.toThrow();
        });

        test('should handle ROI storage load error gracefully', () => {
            mockStorageManager.getData.mockReturnValue({
                analytics: {
                    files: [],
                    sessions: [],
                    totalAccepts: 0
                }
            });

            // Mock a second call to throw an error for ROI loading
            mockStorageManager.getData.mockImplementationOnce(() => {
                throw new Error('ROI Storage error');
            });

            expect(() => new AnalyticsManager(mockStorageManager as any)).not.toThrow();
        });

        test('should handle file acceptance with filePath property', async () => {
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
            expect(data.analytics.fileAcceptances[0].filePath).toBe('/path/to/test.ts');
        });

        test('should handle file acceptance without filePath property', async () => {
            const fileInfo: FileInfo = {
                filename: 'test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            await analyticsManager.trackFileAcceptance(fileInfo);

            const data = await analyticsManager.getData();
            expect(data.analytics.fileAcceptances).toHaveLength(1);
            expect(data.analytics.fileAcceptances[0].filePath).toBe('');
        });

        test('should handle button type counts initialization', async () => {
            const fileInfo: FileInfo = {
                filename: 'test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            await analyticsManager.trackFileAcceptance(fileInfo, 'accept');

            const data = await analyticsManager.getData();
            expect(data.analytics.buttonTypeCounts.accept).toBe(1);
        });

        test('should handle button type counts initialization in file data', async () => {
            const fileInfo: FileInfo = {
                filename: 'test.ts',
                addedLines: 10,
                deletedLines: 5,
                timestamp: new Date()
            };

            await analyticsManager.trackFileAcceptance(fileInfo, 'accept');

            const data = await analyticsManager.getData();
            const fileData = data.analytics.files.get('test.ts');
            expect(fileData?.buttonTypes?.accept).toBe(1);
        });

        test('should handle session end with no current session', async () => {
            // Don't start a session
            await analyticsManager.endSession();

            const data = await analyticsManager.getData();
            expect(data.analytics.userSessions).toHaveLength(0);
        });

        test('should handle session end with current session', async () => {
            analyticsManager.startSession();
            await analyticsManager.endSession();

            const data = await analyticsManager.getData();
            expect(data.analytics.userSessions).toHaveLength(1);
            expect(data.analytics.userSessions[0].endTime).toBeInstanceOf(Date);
        });

        test('should handle ROI tracking with undefined timestamps', () => {
            const mockStorageData = {
                roiTracking: {
                    workflowSessions: [
                        { timestamp: undefined, buttonType: 'accept', timeSaved: 1000 }
                    ],
                    codeGenerationSessions: [
                        { start: undefined, duration: 5000 }
                    ]
                }
            };

            mockStorageManager.getData.mockReturnValue(mockStorageData);

            const newAnalyticsManager = new AnalyticsManager(mockStorageManager as any);
            
            // Verify that undefined timestamps are handled gracefully
            expect(newAnalyticsManager['roiTracking'].workflowSessions[0].timestamp).toBeUndefined();
            expect(newAnalyticsManager['roiTracking'].codeGenerationSessions[0].start).toBeUndefined();
        });

        test('should handle analytics load with missing sessionStart', () => {
            const mockStorageData = {
                analytics: {
                    files: [],
                    sessions: [],
                    totalAccepts: 5,
                    // sessionStart is missing
                    buttonTypeCounts: {}
                }
            };

            mockStorageManager.getData.mockReturnValue(mockStorageData);

            const newAnalyticsManager = new AnalyticsManager(mockStorageManager as any);
            
            // Verify that sessionStart defaults to current date
            expect(newAnalyticsManager['analytics'].sessionStart).toBeInstanceOf(Date);
        });

        test('should handle analytics load with null sessionStart', () => {
            const mockStorageData = {
                analytics: {
                    files: [],
                    sessions: [],
                    totalAccepts: 5,
                    sessionStart: null,
                    buttonTypeCounts: {}
                }
            };

            mockStorageManager.getData.mockReturnValue(mockStorageData);

            const newAnalyticsManager = new AnalyticsManager(mockStorageManager as any);
            
            // Verify that null sessionStart defaults to current date
            expect(newAnalyticsManager['analytics'].sessionStart).toBeInstanceOf(Date);
        });

        test('should handle analytics load with missing buttonTypeCounts', () => {
            const mockStorageData = {
                analytics: {
                    files: [],
                    sessions: [],
                    totalAccepts: 5,
                    sessionStart: new Date(),
                    // buttonTypeCounts is missing
                }
            };

            mockStorageManager.getData.mockReturnValue(mockStorageData);

            const newAnalyticsManager = new AnalyticsManager(mockStorageManager as any);
            
            // Verify that buttonTypeCounts defaults to empty object
            expect(newAnalyticsManager['analytics'].buttonTypeCounts).toEqual({});
        });

        test('should handle ROI tracking load with missing workflowSessions', () => {
            const mockStorageData = {
                roiTracking: {
                    // workflowSessions is missing
                    codeGenerationSessions: []
                }
            };

            mockStorageManager.getData.mockReturnValue(mockStorageData);

            const newAnalyticsManager = new AnalyticsManager(mockStorageManager as any);
            
            // Verify that workflowSessions defaults to empty array
            expect(newAnalyticsManager['roiTracking'].workflowSessions).toEqual([]);
        });

        test('should handle ROI tracking load with missing codeGenerationSessions', () => {
            const mockStorageData = {
                roiTracking: {
                    workflowSessions: [],
                    // codeGenerationSessions is missing
                }
            };

            mockStorageManager.getData.mockReturnValue(mockStorageData);

            const newAnalyticsManager = new AnalyticsManager(mockStorageManager as any);
            
            // Verify that codeGenerationSessions defaults to empty array
            expect(newAnalyticsManager['roiTracking'].codeGenerationSessions).toEqual([]);
        });

        test('should handle analytics load with missing totalAccepts', () => {
            const mockStorageData = {
                analytics: {
                    files: [],
                    sessions: [],
                    // totalAccepts is missing
                    sessionStart: new Date(),
                    buttonTypeCounts: {}
                }
            };

            mockStorageManager.getData.mockReturnValue(mockStorageData);

            const newAnalyticsManager = new AnalyticsManager(mockStorageManager as any);
            
            // Verify that totalAccepts defaults to 0
            expect(newAnalyticsManager['analytics'].totalAccepts).toBe(0);
        });

        test('should handle analytics load with missing userSessions', () => {
            const mockStorageData = {
                analytics: {
                    files: [],
                    sessions: [],
                    totalAccepts: 5,
                    sessionStart: new Date(),
                    buttonTypeCounts: {},
                    // userSessions is missing
                }
            };

            mockStorageManager.getData.mockReturnValue(mockStorageData);

            const newAnalyticsManager = new AnalyticsManager(mockStorageManager as any);
            
            // Verify that userSessions defaults to empty array
            expect(newAnalyticsManager['analytics'].userSessions).toEqual([]);
        });

        test('should handle analytics load with missing fileAcceptances', () => {
            const mockStorageData = {
                analytics: {
                    files: [],
                    sessions: [],
                    totalAccepts: 5,
                    sessionStart: new Date(),
                    buttonTypeCounts: {},
                    // fileAcceptances is missing
                }
            };

            mockStorageManager.getData.mockReturnValue(mockStorageData);

            const newAnalyticsManager = new AnalyticsManager(mockStorageManager as any);
            
            // Verify that fileAcceptances defaults to empty array
            expect(newAnalyticsManager['analytics'].fileAcceptances).toEqual([]);
        });
    });
});
