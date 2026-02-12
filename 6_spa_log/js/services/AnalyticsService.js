/**
 * AnalyticsService - 統計・インサイト生成
 * データから価値を抽出する分析エンジン
 */

export class AnalyticsService {
    calculateStats(logs) {
        if (!logs || logs.length === 0) {
            return {
                totalReboots: 0,
                avgRecovery: 0,
                bestReboot: null,
                streakDays: 0,
                totalMinutes: 0,
                avgDuration: 0
            };
        }

        const totalReboots = logs.length;
        const avgRecovery = logs.reduce((sum, log) => sum + log.postRecovery, 0) / totalReboots;
        const totalMinutes = logs.reduce((sum, log) => sum + parseInt(log.duration), 0);
        const avgDuration = totalMinutes / totalReboots;

        // 最も効果的なリブートタイプ
        const typeRecovery = {};
        logs.forEach(log => {
            if (!typeRecovery[log.type]) {
                typeRecovery[log.type] = { total: 0, count: 0 };
            }
            typeRecovery[log.type].total += log.postRecovery;
            typeRecovery[log.type].count++;
        });

        const bestReboot = Object.entries(typeRecovery)
            .map(([type, data]) => ({
                type,
                avg: data.total / data.count
            }))
            .sort((a, b) => b.avg - a.avg)[0];

        // 連続記録日数
        const streakDays = this.calculateStreak(logs);

        return {
            totalReboots,
            avgRecovery: avgRecovery.toFixed(1),
            bestReboot: bestReboot ? bestReboot.type : null,
            streakDays,
            totalMinutes,
            avgDuration: Math.round(avgDuration)
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

        // インサイト1: 最適リブートタイプ
        if (stats.bestReboot) {
            const typeEmoji = {
                spa: '♨️', sleep: '😴', cycling: '🚴', 
                meditation: '🧘'
            };
            const typeName = {
                spa: 'スパ・サウナ', sleep: '仮眠', cycling: 'サイクリング',
                meditation: '瞑想'
            };
            insights.push({
                icon: '🏆',
                text: `あなたに最も効果的なのは${typeEmoji[stats.bestReboot]}${typeName[stats.bestReboot]}です`,
                priority: 'high'
            });
        }

        // インサイト2: リブート頻度
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

        // インサイト3: 平均回復度
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

        // インサイト4: 連続記録
        if (stats.streakDays >= 7) {
            insights.push({
                icon: '🔥',
                text: `${stats.streakDays}日連続記録中！習慣化できています`,
                priority: 'low'
            });
        }

        // インサイト5: 時間帯分析
        const timeAnalysis = this.analyzeTimePatterns(logs);
        if (timeAnalysis) {
            insights.push({
                icon: '⏰',
                text: timeAnalysis,
                priority: 'medium'
            });
        }

        return insights.sort((a, b) => {
            const priority = { high: 3, medium: 2, low: 1 };
            return priority[b.priority] - priority[a.priority];
        });
    }

    analyzeTimePatterns(logs) {
        if (logs.length < 10) return null;

        const hours = logs.map(log => new Date(log.timestamp).getHours());
        const hourCounts = {};
        
        hours.forEach(hour => {
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const mostCommonHour = Object.entries(hourCounts)
            .sort((a, b) => b[1] - a[1])[0][0];

        const timeLabel = mostCommonHour < 12 ? '午前' : 
                         mostCommonHour < 18 ? '午後' : '夜';

        return `最もリブートが多いのは${timeLabel}${mostCommonHour}時台です`;
    }

    getCurrentHealth(logs) {
        if (!logs || logs.length === 0) {
            return {
                score: 50,
                focus: 50,
                fatigue: 50,
                recovery: 50
            };
        }

        const recentLogs = logs.filter(log => {
            const age = Date.now() - log.timestamp;
            return age < 24 * 60 * 60 * 1000;
        });

        if (recentLogs.length === 0) {
            return {
                score: 50,
                focus: 50,
                fatigue: 70, // リブートがないので疲労高め
                recovery: 30
            };
        }

        const lastLog = logs[0];
        const timeSinceLastReboot = (Date.now() - lastLog.timestamp) / (60 * 60 * 1000); // 時間

        // 回復度から現在のコンディションを推定
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
