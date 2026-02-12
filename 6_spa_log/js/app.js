/**
 * Reboot Dashboard - Main Application Entry
 * エンジニアの自律OS: メインコントローラー
 * @version 2.0.0
 * @author AI-Powered Engineer
 */

import { DataService } from './services/DataService.js';
import { AIAgent } from './services/AIAgent.js';
import { UIController } from './controllers/UIController.js';
import { AnalyticsService } from './services/AnalyticsService.js';
import { ThemeManager } from './utils/ThemeManager.js';

class RebootDashboard {
    constructor() {
        this.dataService = new DataService();
        this.aiAgent = new AIAgent();
        this.analyticsService = new AnalyticsService();
        this.uiController = new UIController();
        this.themeManager = new ThemeManager();
        
        this.init();
    }

    async init() {
        console.log('🚀 Reboot Dashboard initializing...');
        
        try {
            // データベース初期化
            await this.dataService.init();
            
            // UI初期化
            this.uiController.init({
                onLogSubmit: this.handleLogSubmit.bind(this),
                onLogDelete: this.handleLogDelete.bind(this),
                onExport: this.handleExport.bind(this),
                onThemeToggle: this.handleThemeToggle.bind(this)
            });
            
            // テーマ適用
            this.themeManager.init();
            
            // データ読み込み & レンダリング
            await this.loadAndRender();
            
            // AIエージェント起動
            this.startAIMonitoring();
            
            console.log('✅ Dashboard ready');
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.uiController.showError('システム初期化に失敗しました');
        }
    }

    async loadAndRender() {
        const logs = await this.dataService.getAllLogs();
        const stats = this.analyticsService.calculateStats(logs);
        const insights = this.analyticsService.generateInsights(logs);
        const currentHealth = this.analyticsService.getCurrentHealth(logs);
        
        this.uiController.renderLogs(logs);
        this.uiController.renderStats(stats);
        this.uiController.renderInsights(insights);
        this.uiController.renderHealthStatus(currentHealth);
    }

    async handleLogSubmit(logData) {
        try {
            // データ保存
            await this.dataService.saveLog(logData);
            
            // UI更新
            await this.loadAndRender();
            
            // 成功フィードバック
            this.uiController.showSuccess('ログを保存しました');
            
            // AIによる即座の分析
            this.runAIAnalysis();
            
        } catch (error) {
            console.error('Log submit error:', error);
            this.uiController.showError('保存に失敗しました');
        }
    }

    async handleLogDelete(logId) {
        if (!confirm('このログを削除しますか?')) return;
        
        try {
            await this.dataService.deleteLog(logId);
            await this.loadAndRender();
            this.uiController.showSuccess('ログを削除しました');
        } catch (error) {
            console.error('Delete error:', error);
            this.uiController.showError('削除に失敗しました');
        }
    }

    async handleExport() {
        try {
            const logs = await this.dataService.getAllLogs();
            const exportData = {
                version: '2.0.0',
                exportDate: new Date().toISOString(),
                logs: logs,
                stats: this.analyticsService.calculateStats(logs)
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
            
            this.uiController.showSuccess('データをエクスポートしました');
        } catch (error) {
            console.error('Export error:', error);
            this.uiController.showError('エクスポートに失敗しました');
        }
    }

    handleThemeToggle() {
        this.themeManager.toggle();
    }

    startAIMonitoring() {
        // 5分ごとにAI分析を実行
        setInterval(() => {
            this.runAIAnalysis();
        }, 5 * 60 * 1000);
        
        // 初回実行
        setTimeout(() => this.runAIAnalysis(), 3000);
    }

    async runAIAnalysis() {
        const logs = await this.dataService.getAllLogs();
        const decision = this.aiAgent.analyzeAndDecide(logs);
        
        if (decision.shouldAlert) {
            this.uiController.showAIAlert(decision);
        }
        
        // AI状態更新
        this.uiController.updateAIStatus(decision.confidence);
    }
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => {
    window.rebootDashboard = new RebootDashboard();
});
