// ページ読み込み時のアニメーション強化
document.addEventListener('DOMContentLoaded', function() {
    // 追加のパーティクル効果（オプション）
    createSparkles();
    
    // メッセージにホバー効果を追加
    const message = document.querySelector('.message');
    message.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.transition = 'transform 0.3s ease';
    });
    
    message.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// キラキラ効果を追加（オプション）
function createSparkles() {
    const sparkleCount = 20;
    const container = document.querySelector('.background');
    
    for (let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: sparkle ${3 + Math.random() * 2}s infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        container.appendChild(sparkle);
    }
    
    // キラキラアニメーションのCSSを動的に追加
    const style = document.createElement('style');
    style.textContent = `
        @keyframes sparkle {
            0%, 100% {
                opacity: 0;
                transform: scale(0);
            }
            50% {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(style);
}
