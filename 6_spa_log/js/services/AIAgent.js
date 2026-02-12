/**
 * AIAgent - 自律的判断エンジン
 * 「とろけた脳」を検知し、リブートを提案する知能
 */

export class AIAgent {
    constructor() {
        this.config = {
            // 疲労閾値
            fatigueThreshold: 7,
            // 連続作業時間閾値（時間）
            maxContinuousHours: 4,
            // 最適リブート間隔（分）
            optimalRebootInterval: 180,
            // 低回復率閾値
            lowRecoveryThreshold: 4
        };
    }

    /**
     * ログを分析し、行動提案を生成
     * @param {Array} logs - 全てのリブートログ
     * @returns {Object} 判断結果
     */
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
        const recentLogs = logs.filter(log => {
            const age = now - log.timestamp;
            return age < 24 * 60 * 60 * 1000; // 過去24時間
        });

        // 最終リブートからの経過時間
        const lastReboot = logs[0];
        const timeSinceLastReboot = lastReboot ? 
            (now - lastReboot.timestamp) / (60 * 1000) : Infinity; // 分単位

        // 平均回復度（過去7日）
        const weekLogs = logs.filter(log => {
            const age = now - log.timestamp;
            return age < 7 * 24 * 60 * 60 * 1000;
        });
        const avgRecovery = weekLogs.length > 0 ?
            weekLogs.reduce((sum, log) => sum + log.postRecovery, 0) / weekLogs.length : 5;

        // 疲労蓄積パターン検知
        const fatiguePattern = this.detectFatiguePattern(recentLogs);
        
        // 最も効果的なリブート手法
        const bestRebootType = this.findBestRebootType(logs);

        // 現在の推定疲労度（最新ログベース + 経過時間）
        const estimatedFatigue = this.estimateCurrentFatigue(logs, timeSinceLastReboot);

        return {
            timeSinceLastReboot,
            avgRecovery,
            fatiguePattern,
            bestRebootType,
            estimatedFatigue,
            recentRebootCount: recentLogs.length,
            weeklyRebootCount: weekLogs.length
        };
    }

    detectFatiguePattern(recentLogs) {
        if (recentLogs.length < 3) return 'insufficient_data';

        // 回復度が低下傾向にある場合
        const recoveryTrend = recentLogs.slice(0, 3).map(log => log.postRecovery);
        const isDecreasing = recoveryTrend[0] < recoveryTrend[1] && 
                            recoveryTrend[1] < recoveryTrend[2];

        if (isDecreasing) return 'declining';

        // 高疲労が続いている場合
        const highFatigueCount = recentLogs.filter(log => 
            log.preFatigue >= this.config.fatigueThreshold
        ).length;

        if (highFatigueCount >= recentLogs.length * 0.7) return 'chronic';

        return 'normal';
    }

    findBestRebootType(logs) {
        if (logs.length < 5) return null;

        const typeStats = {};
        
        logs.forEach(log => {
            if (!typeStats[log.type]) {
                typeStats[log.type] = {
                    count: 0,
                    totalRecovery: 0,
                    avgRecovery: 0
                };
            }
            typeStats[log.type].count++;
            typeStats[log.type].totalRecovery += log.postRecovery;
        });

        // 平均回復度を計算
        Object.keys(typeStats).forEach(type => {
            typeStats[type].avgRecovery = 
                typeStats[type].totalRecovery / typeStats[type].count;
        });

        // 最高平均回復度のタイプを返す
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

        // 経過時間に応じて疲労度が蓄積
        const fatigueAccumulation = Math.min(
            (timeSinceLastReboot / 60) * 0.5, // 1時間ごとに+0.5
            5
        );

        return Math.min(Math.max(baselineFatigue + fatigueAccumulation, 1), 10);
    }

    makeDecision(analysis) {
        const {
            timeSinceLastReboot,
            avgRecovery,
            fatiguePattern,
            bestRebootType,
            estimatedFatigue
        } = analysis;

        let shouldAlert = false;
        let message = '';
        let action = 'none';
        let confidence = 0;

        // 判断ロジック1: 長時間リブートなし
        if (timeSinceLastReboot > this.config.optimalRebootInterval) {
            shouldAlert = true;
            confidence = Math.min(
                70 + (timeSinceLastReboot - this.config.optimalRebootInterval) / 10,
                95
            );
            action = 'reboot_now';
            message = `⚠️ 前回のリブートから${Math.floor(timeSinceLastReboot / 60)}時間${Math.floor(timeSinceLastReboot % 60)}分が経過しています。`;
            
            if (bestRebootType) {
                message += `\n💡 おすすめ: ${this.getRebootTypeEmoji(bestRebootType.type)} ${this.getRebootTypeName(bestRebootType.type)}（平均回復度: ${bestRebootType.avgRecovery}）`;
            }
        }

        // 判断ロジック2: 慢性疲労パターン検知
        if (fatiguePattern === 'chronic') {
            shouldAlert = true;
            confidence = 85;
            action = 'take_break';
            message = `🚨 慢性的な疲労パターンを検知しました。本格的な休息が必要です。`;
        }

        // 判断ロジック3: 回復度低下傾向
        if (fatiguePattern === 'declining' && avgRecovery < this.config.lowRecoveryThreshold) {
            shouldAlert = true;
            confidence = 75;
            action = 'change_method';
            message = `📉 リブート効果が低下しています。別のリブート手法を試してみましょう。`;
        }

        // 判断ロジック4: 推定疲労度が高い
        if (estimatedFatigue >= this.config.fatigueThreshold && !shouldAlert) {
            shouldAlert = true;
            confidence = 65;
            action = 'reboot_soon';
            message = `💭 現在の推定疲労度: ${estimatedFatigue.toFixed(1)}/10\nそろそろリブートのタイミングです。`;
        }

        return {
            shouldAlert,
            confidence: Math.round(confidence),
            message,
            action,
            analysis
        };
    }

    getRebootTypeEmoji(type) {
        const emojis = {
            spa: '♨️',
            sleep: '😴',
            cycling: '🚴',
            meditation: '🧘'
        };
        return emojis[type] || '🔄';
    }

    getRebootTypeName(type) {
        const names = {
            spa: 'スパ・サウナ',
            sleep: '仮眠',
            cycling: 'サイクリング',
            meditation: '瞑想'
        };
        return names[type] || type;
    }
}
