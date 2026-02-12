/**
 * ThemeManager - テーマ管理
 * ダーク/ライトモード切り替え
 */

export class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.storageKey = 'reboot-dashboard-theme';
    }

    init() {
        // Load saved theme
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
