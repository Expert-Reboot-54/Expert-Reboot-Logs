// ダッシュボードのインタラクティブ機能

document.addEventListener('DOMContentLoaded', function() {
    // チェックリストアイテムのクリックイベント
    const checklistItems = document.querySelectorAll('.checklist-item');
    
    checklistItems.forEach(item => {
        item.addEventListener('click', function() {
            // クリック時のフィードバックアニメーション
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // 経験値バーのアニメーション
    const expFill = document.querySelector('.exp-fill');
    if (expFill) {
        // ページ読み込み時にアニメーション
        setTimeout(() => {
            expFill.style.transition = 'width 1s ease-out';
        }, 500);
    }
    
    // レベルバッジのホバーエフェクト
    const levelBadge = document.querySelector('.level-badge');
    if (levelBadge) {
        levelBadge.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        levelBadge.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    // 統計アイテムのホバーエフェクト
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.stat-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.stat-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });
    
    // スクロール時のフェードイン効果（オプション）
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
            }
        });
    }, observerOptions);
    
    // チェックリストアイテムを監視対象に追加
    checklistItems.forEach(item => {
        observer.observe(item);
    });
    
    console.log('AI学習ロードマップダッシュボードが読み込まれました');
});