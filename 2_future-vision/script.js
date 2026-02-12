// AIネットワーク描画
function createNetwork() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrame;
    
    // キャンバスサイズ設定
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // ノード（接続点）の生成
    const nodeCount = 30;
    const nodes = [];
    const maxDistance = 200;
    
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1
        });
    }
    
    // 光の粒（データパケット）
    const dataPackets = [];
    const packetCount = 15;
    
    for (let i = 0; i < packetCount; i++) {
        dataPackets.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            targetX: Math.random() * canvas.width,
            targetY: Math.random() * canvas.height,
            progress: Math.random(),
            speed: Math.random() * 0.01 + 0.005,
            size: Math.random() * 3 + 2
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // ノードの更新
        nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;
            
            // 境界で跳ね返り
            if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
            
            // 境界内に収める
            node.x = Math.max(0, Math.min(canvas.width, node.x));
            node.y = Math.max(0, Math.min(canvas.height, node.y));
        });
        
        // 接続線の描画
        ctx.strokeStyle = 'rgba(79, 172, 254, 0.2)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.3;
                    ctx.strokeStyle = `rgba(79, 172, 254, ${opacity})`;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }
        
        // ノードの描画
        nodes.forEach(node => {
            ctx.fillStyle = 'rgba(79, 172, 254, 0.6)';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(79, 172, 254, 0.8)';
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        
        // 光の粒（データパケット）の更新と描画
        dataPackets.forEach(packet => {
            packet.progress += packet.speed;
            if (packet.progress >= 1) {
                packet.progress = 0;
                packet.x = packet.targetX;
                packet.y = packet.targetY;
                packet.targetX = Math.random() * canvas.width;
                packet.targetY = Math.random() * canvas.height;
            }
            
            const currentX = packet.x + (packet.targetX - packet.x) * packet.progress;
            const currentY = packet.y + (packet.targetY - packet.y) * packet.progress;
            
            // グラデーションで光の粒を描画
            const gradient = ctx.createRadialGradient(
                currentX, currentY, 0,
                currentX, currentY, packet.size * 3
            );
            gradient.addColorStop(0, 'rgba(79, 172, 254, 1)');
            gradient.addColorStop(0.5, 'rgba(79, 172, 254, 0.5)');
            gradient.addColorStop(1, 'rgba(79, 172, 254, 0)');
            
            ctx.fillStyle = gradient;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(79, 172, 254, 0.8)';
            ctx.beginPath();
            ctx.arc(currentX, currentY, packet.size * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        
        animationFrame = requestAnimationFrame(animate);
    }
    
    animate();
}

// パーティクル生成（強化版）
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 80;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // ランダムな位置とサイズ
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // ランダムな開始位置
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // ランダムなアニメーション遅延
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 20) + 's';
        
        // ランダムな色（グラデーションに合わせて）
        const colors = [
            'rgba(102, 126, 234, 0.8)',
            'rgba(79, 172, 254, 0.9)',
            'rgba(240, 147, 251, 0.7)',
            'rgba(255, 255, 255, 0.6)'
        ];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        particlesContainer.appendChild(particle);
    }
}

// スクロールアニメーション
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                if (entry.target.classList.contains('investment-card')) {
                    entry.target.style.transform = 'translateY(0) scale(1)';
                } else {
                    entry.target.style.transform = 'translateY(0)';
                }
            }
        });
    }, observerOptions);
    
    // アニメーション対象の要素を監視
    const animatedElements = document.querySelectorAll('.vision-card, .timeline-item, .message-content, .courage-content, .investment-content');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
    
    // 投資カードの個別アニメーション
    const investmentCards = document.querySelectorAll('.investment-card');
    investmentCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px) scale(0.9)';
        card.style.transition = `opacity 0.6s ease-out ${index * 0.2}s, transform 0.6s ease-out ${index * 0.2}s`;
        observer.observe(card);
    });
}

// マウス移動に反応するインタラクティブな背景効果
function initInteractiveBackground() {
    const hero = document.querySelector('.hero');
    const circles = document.querySelectorAll('.floating-circle');
    
    hero.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const { width, height, left, top } = hero.getBoundingClientRect();
        
        const x = ((clientX - left) / width - 0.5) * 20;
        const y = ((clientY - top) / height - 0.5) * 20;
        
        circles.forEach((circle, index) => {
            const multiplier = (index + 1) * 0.5;
            circle.style.transform = `translate(${x * multiplier}px, ${y * multiplier}px)`;
        });
    });
}

// CTAボタンのインタラクション
function initCTAButton() {
    const ctaButton = document.querySelector('.cta-button');
    
    if (ctaButton) {
        ctaButton.addEventListener('click', () => {
            // スムーズスクロールでビジョンセクションへ
            const visionSection = document.querySelector('.vision');
            if (visionSection) {
                visionSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        // ホバー時のエフェクト強化
        ctaButton.addEventListener('mouseenter', () => {
            ctaButton.style.transform = 'translateY(-5px) scale(1.05)';
        });
        
        ctaButton.addEventListener('mouseleave', () => {
            ctaButton.style.transform = 'translateY(0) scale(1)';
        });
    }
}

// グラデーションアニメーション強化
function enhanceGradients() {
    const gradientElements = document.querySelectorAll('.title-line, .card-title, .timeline-title, .message-title');
    
    gradientElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            el.style.animation = 'gradient-shift 1s ease infinite';
        });
    });
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    createNetwork();
    createParticles();
    initScrollAnimations();
    initInteractiveBackground();
    initCTAButton();
    enhanceGradients();
    
    // パフォーマンス最適化: リサイズ時の処理を制限
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // 必要に応じて再計算
        }, 250);
    });
});

// スムーズスクロールのポリフィル（必要に応じて）
if (!('scrollBehavior' in document.documentElement.style)) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/cferdinandi/smooth-scroll@15/dist/smooth-scroll.polyfills.min.js';
    document.head.appendChild(script);
}
