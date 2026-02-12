/**
 * Reboot Dashboard - Standalone Bundle
 * すべての機能を1ファイルに統合
 */

// ========================================
// Data Service - IndexedDB管理
// ========================================
class DataService {
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
                
                if (!db.objectStoreNames.contains('logs')) {
                    const logsStore = db.createObjectStore('logs', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    logsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    logsStore.createIndex('type', 'type', { unique: false });
                    logsStore.createIndex('date', 'date', { unique: false });
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

    async deleteLog(logId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['logs'], 'readwrite');
            const store = transaction.objectStore('logs');
            const request = store.delete(logId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// ========================================
// AI Agent - 自律判断エンジン
// ========================================
class AIAgent {
    constructor() {
        this.config = {
            fatigueThreshold: 7,
            maxContinuousHours: 4,
            optimalRebootInterval: 180,
            lowRecoveryThreshold: 4
        };
    }

    analyzeAndDecide(logs) {
        if (!logs || logs.length === 0) {
            return {
                shouldAlert: false,
                confidence: 0,
                message: '',
                action: 'none'
            };
        }

        const analysis = this.performDeepAnalysis(logs);
        const decision = this.makeDecision(analysis);
        
        return decision;
    }

    performDeepAnalysis(logs) {
        const now = Date.now();
        const lastReboot = logs[0];
        const timeSinceLastReboot = lastReboot ? 
            (now - lastReboot.timestamp) / (60 * 1000) : Infinity;

        const weekLogs = logs.filter(log => {
            const age = now - log.timestamp;
            return age < 7 * 24 * 60 * 60 * 1000;
        });
        
        const avgRecovery = weekLogs.length > 0 ?
            weekLogs.reduce((sum, log) => sum + log.postRecovery, 0) / weekLogs.length : 5;

        const bestRebootType = this.findBestRebootType(logs);
        const estimatedFatigue = this.estimateCurrentFatigue(logs, timeSinceLastReboot);

        return {
            timeSinceLastReboot,
            avgRecovery,
            bestRebootType,
            estimatedFatigue
        };
    }

    findBestRebootType(logs) {
        if (logs.length < 5) return null;

        const typeStats = {};
        
        logs.forEach(log => {
            if (!typeStats[log.type]) {
                typeStats[log.type] = { count: 0, totalRecovery: 0 };
            }
            typeStats[log.type].count++;
            typeStats[log.type].totalRecovery += log.postRecovery;
        });

        Object.keys(typeStats).forEach(type => {
            typeStats[type].avgRecovery = 
                typeStats[type].totalRecovery / typeStats[type].count;
        });

        const bestType = Object.entries(typeStats)
            .sort((a, b) => b[1].avgRecovery - a[1].avgRecovery)[0];

        return bestType ? {
            type: bestType[0],
            avgRecovery: bestType[1].avgRecovery.toFixed(1)
        } : null;
    }

    estimateCurrentFatigue(logs, timeSinceLastReboot) {
        if (logs.length === 0) return 5;

        const lastLog = logs[0];
        const baselineFatigue = lastLog.preFatigue - 
                               (lastLog.postRecovery - lastLog.preFatigue);

        const fatigueAccumulation = Math.min(
            (timeSinceLastReboot / 60) * 0.5,
            5
        );

        return Math.min(Math.max(baselineFatigue + fatigueAccumulation, 1), 10);
    }

    makeDecision(analysis) {
        const { timeSinceLastReboot, bestRebootType, estimatedFatigue } = analysis;

        let shouldAlert = false;
        let message = '';
        let confidence = 0;

        if (timeSinceLastReboot > this.config.optimalRebootInterval) {
            shouldAlert = true;
            confidence = Math.min(
                70 + (timeSinceLastReboot - this.config.optimalRebootInterval) / 10,
                95
            );
            message = `⚠️ 前回のリブートから${Math.floor(timeSinceLastReboot / 60)}時間${Math.floor(timeSinceLastReboot % 60)}分が経過しています。`;
            
            if (bestRebootType) {
                const typeNames = {
                    spa: 'スパ・サウナ', sleep: '仮眠', 
                    cycling: 'サイクリング', meditation: '瞑想'
                };
                const typeEmojis = {
                    spa: '♨️', sleep: '😴', cycling: '🚴', meditation: '🧘'
                };
                message += `\n💡 おすすめ: ${typeEmojis[bestRebootType.type]} ${typeNames[bestRebootType.type]}（平均回復度: ${bestRebootType.avgRecovery}）`;
            }
        }

        if (estimatedFatigue >= this.config.fatigueThreshold && !shouldAlert) {
            shouldAlert = true;
            confidence = 65;
            message = `💭 現在の推定疲労度: ${estimatedFatigue.toFixed(1)}/10\nそろそろリブートのタイミングです。`;
        }

        return {
            shouldAlert,
            confidence: Math.round(confidence),
            message
        };
    }
}

// ========================================
// Analytics Service - 統計分析
// ========================================
class AnalyticsService {
    calculateStats(logs) {
        if (!logs || logs.length === 0) {
            return {
                totalReboots: 0,
                avgRecovery: 0,
                bestReboot: null,
                streakDays: 0
            };
        }

        const totalReboots = logs.length;
        const avgRecovery = logs.reduce((sum, log) => sum + log.postRecovery, 0) / totalReboots;

        const typeRecovery = {};
        logs.forEach(log => {
            if (!typeRecovery[log.type]) {
                typeRecovery[log.type] = { total: 0, count: 0 };
            }
            typeRecovery[log.type].total += log.postRecovery;
            typeRecovery[log.type].count++;
        });

        const bestReboot = Object.entries(typeRecovery)
            .map(([type, data]) => ({ type, avg: data.total / data.count }))
            .sort((a, b) => b.avg - a.avg)[0];

        const streakDays = this.calculateStreak(logs);

        return {
            totalReboots,
            avgRecovery: avgRecovery.toFixed(1),
            bestReboot: bestReboot ? bestReboot.type : null,
            streakDays
        };
    }

    calculateStreak(logs) {
        if (logs.length === 0) return 0;

        const dates = [...new Set(logs.map(log => log.date))].sort().reverse();
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const dateStr of dates) {
            const logDate = new Date(dateStr);
            logDate.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((currentDate - logDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === streak) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    generateInsights(logs) {
        const insights = [];

        if (!logs || logs.length === 0) {
            return [{
                icon: '💡',
                text: 'データを記録するとインサイトが表示されます',
                priority: 'low'
            }];
        }

        const stats = this.calculateStats(logs);
        const now = Date.now();

        if (stats.bestReboot) {
            const typeEmojis = {
                spa: '♨️', sleep: '😴', cycling: '🚴', meditation: '🧘'
            };
            const typeNames = {
                spa: 'スパ・サウナ', sleep: '仮眠', 
                cycling: 'サイクリング', meditation: '瞑想'
            };
            insights.push({
                icon: '🏆',
                text: `あなたに最も効果的なのは${typeEmojis[stats.bestReboot]}${typeNames[stats.bestReboot]}です`,
                priority: 'high'
            });
        }

        const recentLogs = logs.filter(log => 
            now - log.timestamp < 7 * 24 * 60 * 60 * 1000
        );
        
        if (recentLogs.length < 7) {
            insights.push({
                icon: '⚠️',
                text: `今週のリブート回数は${recentLogs.length}回。理想は週7回以上です`,
                priority: 'medium'
            });
        } else {
            insights.push({
                icon: '✨',
                text: `素晴らしい！今週は${recentLogs.length}回のリブートを実施`,
                priority: 'low'
            });
        }

        if (parseFloat(stats.avgRecovery) < 5) {
            insights.push({
                icon: '📉',
                text: 'リブートの効果が低下しています。方法を見直しましょう',
                priority: 'high'
            });
        } else if (parseFloat(stats.avgRecovery) >= 7) {
            insights.push({
                icon: '🎯',
                text: `平均回復度${stats.avgRecovery}点！最適化が成功しています`,
                priority: 'low'
            });
        }

        if (stats.streakDays >= 7) {
            insights.push({
                icon: '🔥',
                text: `${stats.streakDays}日連続記録中！習慣化できています`,
                priority: 'low'
            });
        }

        return insights.sort((a, b) => {
            const priority = { high: 3, medium: 2, low: 1 };
            return priority[b.priority] - priority[a.priority];
        });
    }

    getCurrentHealth(logs) {
        if (!logs || logs.length === 0) {
            return { score: 50, focus: 50, fatigue: 50, recovery: 50 };
        }

        const recentLogs = logs.filter(log => {
            const age = Date.now() - log.timestamp;
            return age < 24 * 60 * 60 * 1000;
        });

        if (recentLogs.length === 0) {
            return { score: 50, focus: 50, fatigue: 70, recovery: 30 };
        }

        const lastLog = logs[0];
        const timeSinceLastReboot = (Date.now() - lastLog.timestamp) / (60 * 60 * 1000);

        const baseRecovery = lastLog.postRecovery * 10;
        const timePenalty = Math.min(timeSinceLastReboot * 5, 30);
        
        const recovery = Math.max(baseRecovery - timePenalty, 0);
        const fatigue = Math.min(100 - recovery + 20, 100);
        const focus = Math.max(recovery - 10, 0);
        const score = Math.round((recovery * 0.5 + focus * 0.3 + (100 - fatigue) * 0.2));

        return {
            score: Math.round(score),
            focus: Math.round(focus),
            fatigue: Math.round(fatigue),
            recovery: Math.round(recovery)
        };
    }
}

// ========================================
// Theme Manager
// ========================================
class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.storageKey = 'reboot-dashboard-theme';
    }

    init() {
        const saved = localStorage.getItem(this.storageKey);
        this.currentTheme = saved || 'dark';
        this.apply();
    }

    toggle() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.apply();
        this.save();
    }

    apply() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    save() {
        localStorage.setItem(this.storageKey, this.currentTheme);
    }
}

// ========================================
// Main Application
// ========================================
class RebootDashboard {
    constructor() {
        this.dataService = new DataService();
        this.aiAgent = new AIAgent();
        this.analyticsService = new AnalyticsService();
        this.themeManager = new ThemeManager();
        this.elements = {};
        
        this.init();
    }

    async init() {
        console.log('🚀 Reboot Dashboard initializing...');
        
        try {
            await this.dataService.init();
            this.cacheElements();
            this.attachEventListeners();
            this.initializeForm();
            this.themeManager.init();
            await this.loadAndRender();
            this.startAIMonitoring();
            
            console.log('✅ Dashboard ready');
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showError('システム初期化に失敗しました');
        }
    }

    cacheElements() {
        this.elements = {
            form: document.getElementById('rebootForm'),
            timestamp: document.getElementById('timestamp'),
            duration: document.getElementById('duration'),
            rebootTypes: document.getElementById('rebootTypes'),
            rebootType: document.getElementById('rebootType'),
            preFatigue: document.getElementById('preFatigue'),
            preFatigueValue: document.getElementById('preFatigueValue'),
            postRecovery: document.getElementById('postRecovery'),
            postRecoveryValue: document.getElementById('postRecoveryValue'),
            notes: document.getElementById('notes'),
            charCount: document.getElementById('charCount'),
            
            logsList: document.getElementById('logsList'),
            healthScore: document.getElementById('healthScore'),
            focusBar: document.getElementById('focusBar'),
            focusValue: document.getElementById('focusValue'),
            fatigueBar: document.getElementById('fatigueBar'),
            fatigueValue: document.getElementById('fatigueValue'),
            recoveryBar: document.getElementById('recoveryBar'),
            recoveryValue: document.getElementById('recoveryValue'),
            
            totalReboots: document.getElementById('totalReboots'),
            avgRecovery: document.getElementById('avgRecovery'),
            bestReboot: document.getElementById('bestReboot'),
            streakDays: document.getElementById('streakDays'),
            insightsList: document.getElementById('insightsList'),
            
            themeToggle: document.getElementById('themeToggle'),
            exportLogs: document.getElementById('exportLogs'),
            aiAgentAlert: document.getElementById('aiAgentAlert'),
            aiAlertText: document.getElementById('aiAlertText'),
            alertDismiss: document.getElementById('alertDismiss')
        };
    }

    attachEventListeners() {
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        this.elements.rebootTypes.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectRebootType(btn);
            });
        });

        this.elements.preFatigue.addEventListener('input', (e) => {
            this.elements.preFatigueValue.textContent = e.target.value;
        });

        this.elements.postRecovery.addEventListener('input', (e) => {
            this.elements.postRecoveryValue.textContent = e.target.value;
        });

        this.elements.notes.addEventListener('input', (e) => {
            this.elements.charCount.textContent = e.target.value.length;
        });

        this.elements.themeToggle.addEventListener('click', () => {
            this.themeManager.toggle();
        });

        this.elements.exportLogs.addEventListener('click', () => {
            this.handleExport();
        });

        this.elements.alertDismiss.addEventListener('click', () => {
            this.hideAIAlert();
        });
    }

    initializeForm() {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        this.elements.timestamp.value = now.toISOString().slice(0, 16);
    }

    selectRebootType(btn) {
        this.elements.rebootTypes.querySelectorAll('.type-btn').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');
        this.elements.rebootType.value = btn.dataset.type;
    }

    async handleFormSubmit() {
        const formData = {
            timestamp: this.elements.timestamp.value,
            duration: parseInt(this.elements.duration.value),
            type: this.elements.rebootType.value,
            preFatigue: parseInt(this.elements.preFatigue.value),
            postRecovery: parseInt(this.elements.postRecovery.value),
            notes: this.elements.notes.value.trim()
        };

        if (!formData.type) {
            this.showError('リブート種類を選択してください');
            return;
        }

        try {
            await this.dataService.saveLog(formData);
            await this.loadAndRender();
            this.showSuccess('ログを保存しました');
            this.resetForm();
            this.runAIAnalysis();
        } catch (error) {
            console.error('Log submit error:', error);
            this.showError('保存に失敗しました');
        }
    }

    resetForm() {
        this.elements.form.reset();
        this.initializeForm();
        this.elements.rebootTypes.querySelectorAll('.type-btn').forEach(b => {
            b.classList.remove('active');
        });
        this.elements.rebootType.value = '';
        this.elements.preFatigueValue.textContent = '5';
        this.elements.postRecoveryValue.textContent = '5';
        this.elements.charCount.textContent = '0';
    }

    async loadAndRender() {
        const logs = await this.dataService.getAllLogs();
        const stats = this.analyticsService.calculateStats(logs);
        const insights = this.analyticsService.generateInsights(logs);
        const currentHealth = this.analyticsService.getCurrentHealth(logs);
        
        this.renderLogs(logs);
        this.renderStats(stats);
        this.renderInsights(insights);
        this.renderHealthStatus(currentHealth);
    }

    renderLogs(logs) {
        if (!logs || logs.length === 0) {
            this.elements.logsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🌱</div>
                    <p class="empty-text">まだログがありません</p>
                    <p class="empty-subtext">最初のリブートを記録して、自己最適化を始めましょう</p>
                </div>
            `;
            return;
        }

        const typeEmojis = {
            spa: '♨️', sleep: '😴', cycling: '🚴', meditation: '🧘'
        };

        const typeNames = {
            spa: 'スパ・サウナ', sleep: '仮眠', 
            cycling: 'サイクリング', meditation: '瞑想'
        };

        this.elements.logsList.innerHTML = logs.slice(0, 20).map(log => {
            const date = new Date(log.timestamp);
            const dateStr = date.toLocaleDateString('ja-JP', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const improvement = log.postRecovery - log.preFatigue;
            const improvementClass = improvement > 0 ? 'positive' : 'neutral';

            return `
                <div class="log-item" data-log-id="${log.id}">
                    <div class="log-item-header">
                        <div class="log-type">
                            <span class="log-emoji">${typeEmojis[log.type] || '🔄'}</span>
                            <span class="log-type-name">${typeNames[log.type] || log.type}</span>
                        </div>
                        <div class="log-date">${dateStr}</div>
                    </div>
                    <div class="log-item-body">
                        <div class="log-metrics">
                            <div class="log-metric">
                                <span class="metric-icon">⏱️</span>
                                <span class="metric-text">${log.duration}分</span>
                            </div>
                            <div class="log-metric">
                                <span class="metric-icon">📊</span>
                                <span class="metric-text">${log.preFatigue} → ${log.postRecovery}</span>
                                <span class="improvement ${improvementClass}">
                                    ${improvement > 0 ? '+' : ''}${improvement}
                                </span>
                            </div>
                        </div>
                        ${log.notes ? `<div class="log-notes">${this.escapeHtml(log.notes)}</div>` : ''}
                    </div>
                    <button class="log-delete" onclick="dashboard.deleteLog(${log.id})">
                        🗑️
                    </button>
                </div>
            `;
        }).join('');
    }

    renderStats(stats) {
        this.elements.totalReboots.textContent = stats.totalReboots;
        this.elements.avgRecovery.textContent = stats.avgRecovery;
        
        const typeEmojis = {
            spa: '♨️', sleep: '😴', cycling: '🚴', meditation: '🧘'
        };
        const typeNames = {
            spa: 'スパ・サウナ', sleep: '仮眠', 
            cycling: 'サイクリング', meditation: '瞑想'
        };
        
        this.elements.bestReboot.textContent = stats.bestReboot ? 
            `${typeEmojis[stats.bestReboot]}${typeNames[stats.bestReboot]}` : '--';
        this.elements.streakDays.textContent = stats.streakDays;
    }

    renderInsights(insights) {
        if (!insights || insights.length === 0) {
            this.elements.insightsList.innerHTML = `
                <div class="insight-item">
                    <span class="insight-icon">💡</span>
                    <span class="insight-text">データを記録するとインサイトが表示されます</span>
                </div>
            `;
            return;
        }

        this.elements.insightsList.innerHTML = insights.map(insight => `
            <div class="insight-item priority-${insight.priority}">
                <span class="insight-icon">${insight.icon}</span>
                <span class="insight-text">${insight.text}</span>
            </div>
        `).join('');
    }

    renderHealthStatus(health) {
        this.elements.healthScore.textContent = health.score;
        
        this.elements.focusBar.style.width = `${health.focus}%`;
        this.elements.focusValue.textContent = health.focus;
        
        this.elements.fatigueBar.style.width = `${health.fatigue}%`;
        this.elements.fatigueValue.textContent = health.fatigue;
        
        this.elements.recoveryBar.style.width = `${health.recovery}%`;
        this.elements.recoveryValue.textContent = health.recovery;

        const scoreEl = this.elements.healthScore;
        scoreEl.className = 'health-score';
        if (health.score >= 70) scoreEl.classList.add('excellent');
        else if (health.score >= 50) scoreEl.classList.add('good');
        else scoreEl.classList.add('poor');
    }

    async deleteLog(logId) {
        if (!confirm('このログを削除しますか?')) return;
        
        try {
            await this.dataService.deleteLog(logId);
            await this.loadAndRender();
            this.showSuccess('ログを削除しました');
        } catch (error) {
            console.error('Delete error:', error);
            this.showError('削除に失敗しました');
        }
    }

    async handleExport() {
        try {
            const logs = await this.dataService.getAllLogs();
            const exportData = {
                version: '2.0.0',
                exportDate: new Date().toISOString(),
                logs: logs
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reboot-logs-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showSuccess('データをエクスポートしました');
        } catch (error) {
            console.error('Export error:', error);
            this.showError('エクスポートに失敗しました');
        }
    }

    startAIMonitoring() {
        setInterval(() => {
            this.runAIAnalysis();
        }, 5 * 60 * 1000);
        
        setTimeout(() => this.runAIAnalysis(), 3000);
    }

    async runAIAnalysis() {
        const logs = await this.dataService.getAllLogs();
        const decision = this.aiAgent.analyzeAndDecide(logs);
        
        if (decision.shouldAlert) {
            this.showAIAlert(decision);
        }
    }

    showAIAlert(decision) {
        this.elements.aiAlertText.textContent = decision.message;
        this.elements.aiAgentAlert.classList.remove('hidden');
        
        setTimeout(() => {
            this.hideAIAlert();
        }, 10000);
    }

    hideAIAlert() {
        this.elements.aiAgentAlert.classList.add('hidden');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize application
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new RebootDashboard();
});
