/**
 * DataService - IndexedDB データ永続化層
 * 2026年標準: 高性能な構造化ストレージ
 */

export class DataService {
    constructor() {
        this.dbName = 'RebootDashboardDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // ログストア
                if (!db.objectStoreNames.contains('logs')) {
                    const logsStore = db.createObjectStore('logs', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    logsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    logsStore.createIndex('type', 'type', { unique: false });
                    logsStore.createIndex('date', 'date', { unique: false });
                }
                
                // AI予測キャッシュストア
                if (!db.objectStoreNames.contains('aiCache')) {
                    const cacheStore = db.createObjectStore('aiCache', { keyPath: 'key' });
                    cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async saveLog(logData) {
        const log = {
            ...logData,
            id: Date.now(),
            timestamp: new Date(logData.timestamp).getTime(),
            date: new Date(logData.timestamp).toISOString().split('T')[0],
            createdAt: Date.now()
        };
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['logs'], 'readwrite');
            const store = transaction.objectStore('logs');
            const request = store.add(log);
            
            request.onsuccess = () => resolve(log);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllLogs() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['logs'], 'readonly');
            const store = transaction.objectStore('logs');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const logs = request.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(logs);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getLogsByDateRange(startDate, endDate) {
        const allLogs = await this.getAllLogs();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        
        return allLogs.filter(log => {
            return log.timestamp >= start && log.timestamp <= end;
        });
    }

    async deleteLog(logId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['logs'], 'readwrite');
            const store = transaction.objectStore('logs');
            const request = store.delete(logId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async saveAICache(key, data) {
        const cacheData = {
            key,
            data,
            timestamp: Date.now()
        };
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['aiCache'], 'readwrite');
            const store = transaction.objectStore('aiCache');
            const request = store.put(cacheData);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAICache(key, maxAge = 3600000) { // デフォルト1時間
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['aiCache'], 'readonly');
            const store = transaction.objectStore('aiCache');
            const request = store.get(key);
            
            request.onsuccess = () => {
                const cache = request.result;
                if (!cache) {
                    resolve(null);
                    return;
                }
                
                const age = Date.now() - cache.timestamp;
                if (age > maxAge) {
                    resolve(null);
                } else {
                    resolve(cache.data);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
}
