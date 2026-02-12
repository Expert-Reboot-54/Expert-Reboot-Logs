/**
 * UIController - ビュー制御層
 * DOM操作とユーザーインタラクションを管理
 */

export class UIController {
    constructor() {
        this.elements = {};
        this.handlers = {};
    }

    init(handlers) {
        this.handlers = handlers;
        this.cacheElements();
        this.attachEventListeners();
        this.initializeForm();
    }

    cacheElements() {
        // Form elements
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
            
            // Display elements
            logsList: document.getElementById('logsList'),
            healthScore: document.getElementById('healthScore'),
            focusBar: document.getElementById('focusBar'),
            focusValue: document.getElementById('focusValue'),
            fatigueBar: document.getElementById('fatigueBar'),
            fatigueValue: document.getElementById('fatigueValue'),
            recoveryBar: document.getElementById('recoveryBar'),
            recoveryValue: document.getElementById('recoveryValue'),
            
            // Stats elements
            totalReboots: document.getElementById('totalReboots'),
            avgRecovery: document.getElementById('avgRecovery'),
            bestReboot: document.getElementById('bestReboot'),
            streakDays: document.getElementById('streakDays'),
            insightsList: document.getElementById('insightsList'),
            
            // Controls
            themeToggle: document.getElementById('themeToggle'),
            exportLogs: document.getElementById('exportLogs'),
            aiStatus: document.getElementById('aiStatus'),
            aiAgentAlert: document.getElementById('aiAgentAlert'),
            aiAlertText: document.getElementById('aiAlertText'),
            alertDismiss: document.getElementById('alertDismiss')
        };
    }

    attachEventListeners() {
        // Form submission
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Reboot type selection
        this.elements.rebootTypes.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectRebootType(btn);
            });
        });

        // Sliders
        this.elements.preFatigue.addEventListener('input', (e) => {
            this.elements.preFatigueValue.textContent = e.target.value;
        });

        this.elements.postRecovery.addEventListener('input', (e) => {
            this.elements.postRecoveryValue.textContent = e.target.value;
        });

        // Character counter
        this.elements.notes.addEventListener('input', (e) => {
            this.elements.charCount.textContent = e.target.value.length;
        });

        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => {
            this.handlers.onThemeToggle();
        });

        // Export
        this.elements.exportLogs.addEventListener('click', () => {
            this.handlers.onExport();
        });

        // AI alert dismiss
        this.elements.alertDismiss.addEventListener('click', () => {
            this.hideAIAlert();
        });
    }

    initializeForm() {
        // Set default timestamp to now
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        this.elements.timestamp.value = now.toISOString().slice(0, 16);
    }

    selectRebootType(btn) {
        // Remove active class from all buttons
        this.elements.rebootTypes.querySelectorAll('.type-btn').forEach(b => {
            b.classList.remove('active');
        });
        
        // Add active class to selected button
        btn.classList.add('active');
        
        // Set hidden input value
        this.elements.rebootType.value = btn.dataset.type;
    }

    handleFormSubmit() {
        const formData = {
            timestamp: this.elements.timestamp.value,
            duration: parseInt(this.elements.duration.value),
            type: this.elements.rebootType.value,
            preFatigue: parseInt(this.elements.preFatigue.value),
            postRecovery: parseInt(this.elements.postRecovery.value),
            notes: this.elements.notes.value.trim()
        };

        // Validation
        if (!formData.type) {
            this.showError('リブート種類を選択してください');
            return;
        }

        this.handlers.onLogSubmit(formData);
        this.resetForm();
    }

    resetForm() {
        this.elements.form.reset();
        this.initializeForm();
        
        // Reset reboot type selection
        this.elements.rebootTypes.querySelectorAll('.type-btn').forEach(b => {
            b.classList.remove('active');
        });
        this.elements.rebootType.value = '';
        
        // Reset sliders
        this.elements.preFatigueValue.textContent = '5';
        this.elements.postRecoveryValue.textContent = '5';
        this.elements.charCount.textContent = '0';
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
            spa: '♨️', sleep: '😴', cycling: '🚴',
            meditation: '🧘'
        };

        const typeNames = {
            spa: 'スパ・サウナ', sleep: '仮眠', cycling: 'サイクリング',
            meditation: '瞑想'
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
                            <span class="log-emoji">${typeEmojis[log.type]}</span>
                            <span class="log-type-name">${typeNames[log.type]}</span>
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
                    <button class="log-delete" onclick="window.rebootDashboard.handleLogDelete(${log.id})">
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
            spa: '♨️', sleep: '😴', cycling: '🚴',
            meditation: '🧘'
        };
        const typeNames = {
            spa: 'スパ・サウナ', sleep: '仮眠', cycling: 'サイクリング',
            meditation: '瞑想'
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

        // Add color coding for score
        const scoreEl = this.elements.healthScore;
        scoreEl.className = 'health-score';
        if (health.score >= 70) scoreEl.classList.add('excellent');
        else if (health.score >= 50) scoreEl.classList.add('good');
        else scoreEl.classList.add('poor');
    }

    showAIAlert(decision) {
        this.elements.aiAlertText.textContent = decision.message;
        this.elements.aiAgentAlert.classList.remove('hidden');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideAIAlert();
        }, 10000);
    }

    hideAIAlert() {
        this.elements.aiAgentAlert.classList.add('hidden');
    }

    updateAIStatus(confidence) {
        const statusText = this.elements.aiStatus.querySelector('.status-text');
        if (confidence > 70) {
            statusText.textContent = 'AI高精度監視中';
        } else if (confidence > 0) {
            statusText.textContent = 'AI監視中';
        } else {
            statusText.textContent = 'AIスタンバイ';
        }
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
