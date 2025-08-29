import * as vscode from 'vscode';

export interface StorageData {
  totalClicks?: number;
  isRunning?: boolean;
  timestamp?: Date;
  analytics?: any;
  roiTracking?: any;
  savedAt?: Date;
}

export class StorageManager {
  private readonly storageKey = 'cursor-auto-accept-data';
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public saveData(data: StorageData): void {
    try {
      // Add timestamp if not provided
      if (!data.timestamp) {
        data.timestamp = new Date();
      }

      // Convert dates to ISO strings for storage
      const serializedData = this.serializeData(data);

      // Save to VS Code extension storage
      this.context.globalState.update(this.storageKey, serializedData);
    } catch (error) {
      // Handle save error silently
    }
  }

  public getData(): StorageData | null {
    try {
      const serializedData = this.context.globalState.get(this.storageKey);
      if (!serializedData) {
        return null;
      }
      return this.deserializeData(serializedData);
    } catch (error) {
      // Handle load error silently
      return null;
    }
  }

  public clearAllData(): void {
    try {
      this.context.globalState.update(this.storageKey, undefined);
    } catch (error) {
      // Handle clear error silently
    }
  }

  public hasData(): boolean {
    try {
      const data = this.context.globalState.get(this.storageKey);
      return data !== undefined && data !== null;
    } catch (error) {
      return false;
    }
  }

  public getStorageInfo(): { hasData: boolean; lastSaved?: Date; dataSize?: number } {
    try {
      const data = this.context.globalState.get(this.storageKey);
      if (!data) {
        return { hasData: false };
      }

      const deserialized = this.deserializeData(data);
      const dataSize = JSON.stringify(data).length;

      return {
        hasData: true,
        lastSaved: deserialized.savedAt || deserialized.timestamp,
        dataSize,
      };
    } catch (error) {
      return { hasData: false };
    }
  }

  private serializeData(data: StorageData): any {
    const serialized = { ...data };

    // Convert Date objects to ISO strings
    if (serialized.timestamp && typeof serialized.timestamp === 'string') {
      serialized.timestamp = new Date(serialized.timestamp);
    }
    if (serialized.savedAt && typeof serialized.savedAt === 'string') {
      serialized.savedAt = new Date(serialized.savedAt);
    }

    // Handle nested date objects in analytics
    if (serialized.analytics) {
      if (serialized.analytics.sessionStart) {
        serialized.analytics.sessionStart = serialized.analytics.sessionStart.toISOString();
      }
      if (serialized.analytics.sessions) {
        serialized.analytics.sessions = serialized.analytics.sessions.map((session: any) => ({
          ...session,
          timestamp: session.timestamp ? session.timestamp.toISOString() : undefined,
        }));
      }
      if (serialized.analytics.files) {
        serialized.analytics.files = serialized.analytics.files.map(
          ([filename, fileData]: [string, any]) => [
            filename,
            {
              ...fileData,
              firstAccepted: fileData.firstAccepted
                ? fileData.firstAccepted.toISOString()
                : undefined,
              lastAccepted: fileData.lastAccepted ? fileData.lastAccepted.toISOString() : undefined,
            },
          ]
        );
      }
    }

    // Handle nested date objects in ROI tracking
    if (serialized.roiTracking) {
      if (serialized.roiTracking.workflowSessions) {
        serialized.roiTracking.workflowSessions = serialized.roiTracking.workflowSessions.map(
          (session: any) => ({
            ...session,
            timestamp: session.timestamp ? session.timestamp.toISOString() : undefined,
          })
        );
      }
      if (serialized.roiTracking.codeGenerationSessions) {
        serialized.roiTracking.codeGenerationSessions =
          serialized.roiTracking.codeGenerationSessions.map((session: any) => ({
            ...session,
            start: session.start ? session.start.toISOString() : undefined,
          }));
      }
    }

    return serialized;
  }

  private deserializeData(data: any): StorageData {
    const deserialized = { ...data };

    // Convert ISO strings back to Date objects
    if (deserialized.timestamp) {
      deserialized.timestamp = new Date(deserialized.timestamp);
    }
    if (deserialized.savedAt) {
      deserialized.savedAt = new Date(deserialized.savedAt);
    }

    // Handle nested date objects in analytics
    if (deserialized.analytics) {
      if (deserialized.analytics.sessionStart) {
        deserialized.analytics.sessionStart = new Date(deserialized.analytics.sessionStart);
      }
      if (deserialized.analytics.sessions) {
        deserialized.analytics.sessions = deserialized.analytics.sessions.map((session: any) => ({
          ...session,
          timestamp: session.timestamp ? new Date(session.timestamp) : undefined,
        }));
      }
      if (deserialized.analytics.files) {
        deserialized.analytics.files = deserialized.analytics.files.map(
          ([filename, fileData]: [string, any]) => [
            filename,
            {
              ...fileData,
              firstAccepted: fileData.firstAccepted ? new Date(fileData.firstAccepted) : undefined,
              lastAccepted: fileData.lastAccepted ? new Date(fileData.lastAccepted) : undefined,
            },
          ]
        );
      }
    }

    // Handle nested date objects in ROI tracking
    if (deserialized.roiTracking) {
      if (deserialized.roiTracking.workflowSessions) {
        deserialized.roiTracking.workflowSessions = deserialized.roiTracking.workflowSessions.map(
          (session: any) => ({
            ...session,
            timestamp: session.timestamp ? new Date(session.timestamp) : undefined,
          })
        );
      }
      if (deserialized.roiTracking.codeGenerationSessions) {
        deserialized.roiTracking.codeGenerationSessions =
          deserialized.roiTracking.codeGenerationSessions.map((session: any) => ({
            ...session,
            start: session.start ? new Date(session.start) : undefined,
          }));
      }
    }

    return deserialized;
  }

  public exportStorageData(): void {
    try {
      const data = this.getData();
      if (!data) {
        return;
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cursor-auto-accept-storage-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      // Handle export error silently
    }
  }

  public importStorageData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      // Validate the data structure
      if (!this.validateImportedData(data)) {
        return false;
      }

      // Save the imported data
      this.saveData(data);
      return true;
    } catch (error) {
      // Handle import error silently
      return false;
    }
  }

  private validateImportedData(data: any): boolean {
    // Basic validation - check if it has expected structure
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for required fields (at least one should be present)
    const hasAnalytics = data.analytics && typeof data.analytics === 'object';
    const hasROI = data.roiTracking && typeof data.roiTracking === 'object';
    const hasBasic = data.totalClicks !== undefined || data.isRunning !== undefined;

    return hasAnalytics || hasROI || hasBasic;
  }

  public getStorageUsage(): { used: number; available: number; percentage: number } {
    try {
      const data = this.context.globalState.get(this.storageKey);
      if (!data) {
        return { used: 0, available: 100, percentage: 0 };
      }

      const dataSize = JSON.stringify(data).length;
      const maxSize = 1024 * 1024; // 1MB limit (typical for extension storage)
      const percentage = Math.round((dataSize / maxSize) * 100);

      return {
        used: dataSize,
        available: maxSize - dataSize,
        percentage: Math.min(percentage, 100),
      };
    } catch (error) {
      return { used: 0, available: 100, percentage: 0 };
    }
  }

  public cleanupOldData(maxAgeDays: number = 30): void {
    try {
      const data = this.getData();
      if (!data) {
        return;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
      let hasChanges = false;

      // Clean up old sessions
      if (data.analytics && data.analytics.sessions) {
        const originalLength = data.analytics.sessions.length;
        data.analytics.sessions = data.analytics.sessions.filter((session: any) => {
          const sessionDate = new Date(session.timestamp);
          return sessionDate > cutoffDate;
        });

        if (data.analytics.sessions.length < originalLength) {
          hasChanges = true;
        }
      }

      // Clean up old workflow sessions
      if (data.roiTracking && data.roiTracking.workflowSessions) {
        const originalLength = data.roiTracking.workflowSessions.length;
        data.roiTracking.workflowSessions = data.roiTracking.workflowSessions.filter(
          (session: any) => {
            const sessionDate = new Date(session.timestamp);
            return sessionDate > cutoffDate;
          }
        );

        if (data.roiTracking.workflowSessions.length < originalLength) {
          hasChanges = true;
        }
      }

      // Save if changes were made
      if (hasChanges) {
        this.saveData(data);
      }
    } catch (error) {
      // Handle cleanup error silently
    }
  }
}
