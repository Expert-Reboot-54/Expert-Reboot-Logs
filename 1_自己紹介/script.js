// スムーズなスクロールとインタラクション

document.addEventListener('DOMContentLoaded', function() {
    // スクロール時のふわっと浮き上がるアニメーション
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // 一度表示されたら監視を停止（パフォーマンス向上）
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // アニメーション対象の要素を監視（fade-in-upクラスが付いているすべての要素）
    const animatedElements = document.querySelectorAll('.fade-in-up');
    
    animatedElements.forEach((el, index) => {
        // 各要素に少しずつ遅延を追加して、より自然なアニメーションに
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });

    // コンタクトリンクのホバー効果強化
    const contactLinks = document.querySelectorAll('.contact-link');
    contactLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});
