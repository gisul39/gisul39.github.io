const output = document.getElementById('output');
const params = new URLSearchParams(window.location.search);
const fileName = params.get('file');

// 1. メタ情報・ファビコンの設定
function setupMeta(title, description) {
    document.title = `${title} | Gisul39`;
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
    }
    favicon.href = './icon.png';

    const metaData = [
        { name: 'description', content: description },
        { property: 'og:title', content: `${title} | Gisul39` },
        { property: 'og:description', content: description },
        { name: 'twitter:card', content: 'summary_large_image' }
    ];

    metaData.forEach(data => {
        let meta = document.querySelector(`meta[${data.name ? 'name' : 'property'}="${data.name || data.property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            if (data.name) meta.setAttribute('name', data.name);
            if (data.property) meta.setAttribute('property', data.property);
            document.head.appendChild(meta);
        }
        meta.content = data.content;
    });
}

// 2. Google Fonts 読み込み
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;700&display=swap';
document.head.appendChild(link);

// 3. 配色計算ロジック
function applyDynamicTheme(hex) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    const lighten = (r, g, b, factor) => {
        const res = [r, g, b].map(v => Math.round(v + (255 - v) * factor));
        return `rgb(${res[0]}, ${res[1]}, ${res[2]})`;
    };
    const darken = (r, g, b, factor) => {
        const res = [r, g, b].map(v => Math.round(v * (1 - factor)));
        return `rgb(${res[0]}, ${res[1]}, ${res[2]})`;
    };

    const styles = `
        :root {
            --btn-bg: ${darken(r, g, b, 0.4)};
            --btn-text: #ffffff;
            --bg: ${lighten(r, g, b, 0.95)};
            --text: ${darken(r, g, b, 0.85)};
            --h1-color: ${darken(r, g, b, 0.5)};
            --primary: ${darken(r, g, b, 0.4)};
            --logo-filter: invert(1) drop-shadow(0 4px 24px #ffffff0d); /* ライトモード：黒+白シャドウ */
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --btn-bg: ${lighten(r, g, b, 0.4)};
                --btn-text: ${darken(r, g, b, 0.7)};
                --bg: #1d2024;
                --text: #e2e2e9;
                --h1-color: ${lighten(r, g, b, 0.6)};
                --primary: ${lighten(r, g, b, 0.4)};
                --logo-filter: drop-shadow(0 4px 24px #0000000d); /* ダークモード：白+黒シャドウ */
            }
        }
    `;

    let styleTag = document.getElementById('dynamic-theme');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-theme';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = styles;
}

// 4. 基本UIスタイル
const baseStyle = document.createElement('style');
baseStyle.textContent = `
    body {
        font-family: 'Shippori Mincho', serif;
        background-color: var(--bg);
        color: var(--text);
        margin: 0; padding: 0;
        line-height: 1.9;
        transition: all 0.6s cubic-bezier(0.25, 0.19, 0, 1);
    }
    .global-header {
        position: fixed; top: 0; left: 0; width: 100%;
        padding: 16px; box-sizing: border-box;
        background: transparent;
        z-index: 100; display: flex; align-items: center;
    }
    .header-logo { 
        height: 52px;
        cursor: pointer;
        transition: filter 0.3s ease;
        /* デフォルト：明度0(黒)に反転(白)をかけ、変数のフィルタを適用 */
        filter: brightness(0) invert(1) var(--logo-filter);
    }
    /* 背景画像の上にいる時の強制白色+薄い黒シャドウ */
    .header-logo.on-image {
        filter: brightness(0) invert(1) drop-shadow(0 4px 24px #0000000d) !important;
    }
    .header-img { width: 100%; height: 45vh; object-fit: cover; display: block; }
    .content-inner { padding: 24px; max-width: 800px; margin: 0 auto; }
    h1 { color: var(--h1-color); font-size: 1.8rem; margin: 2rem 0 1rem; }
    h2 { color: var(--primary); font-size: 1.4rem; margin: 2.5rem 0 1rem; font-weight: 700; }
    .footer-actions { padding: 40px 24px 100px; display: flex; justify-content: center; padding-bottom:15vh; }
    .back-btn {
        width: 100%; max-width: 400px; padding: 18px; border-radius: 100px;
        background-color: var(--btn-bg); color: var(--btn-text);
        border: none; font-family: inherit; font-size: 1rem; font-weight: bold; cursor: pointer;
    }
/* アニメーションの定義：上下の端でブラー、中央でくっきり */
@keyframes blur-in-out {
    /* 画面に入り始め（下端） */
    0% { filter: blur(8px); opacity: 0.6; }
    
    /* 画面内に入りきった状態（中央付近） */
    20%, 80% { filter: blur(0px); opacity: 1; }
    
    /* 画面から出ていくとき（上端） */
    100% { filter: blur(8px); opacity: 0.6; }
}

/* 対象要素にスクロールタイムラインを適用 */
h1, h2, h3, p {
    view-timeline-name: --element-visible;
    view-timeline-axis: block;

    /* アニメーション設定 */
    animation: blur-in-out linear both; /* イージングは必要に応じて調整 */
    animation-timeline: --element-visible;
    
    /* entry 0% : 要素の上が画面の下端に触れた時
       exit 100%: 要素の下が画面の上端から消えた時
    */
    animation-range: entry 0% exit 100%;
    
    will-change: filter, opacity;
}
`;
document.head.appendChild(baseStyle);

// 5. ヘッダーの動的追加
const header = document.createElement('header');
header.className = 'global-header';
header.innerHTML = `<img src="./main.svg" id="main-logo" class="header-logo" alt="logo" onclick="location.href='./'">`;
document.body.prepend(header);

// 6. スクロール監視ロジック (背景画像との重なり判定)
function handleScroll() {
    const logo = document.getElementById('main-logo');
    const heroImage = document.querySelector('.header-img');
    if (!logo || !heroImage) return;

    const heroBottom = heroImage.getBoundingClientRect().bottom;
    const logoBottom = logo.getBoundingClientRect().bottom;

    // ロゴの底が背景画像の底より上にある場合は白色クラスを付与
    if (logoBottom < heroBottom) {
        logo.classList.add('on-image');
    } else {
        logo.classList.remove('on-image');
    }
}

window.addEventListener('scroll', handleScroll);

// 7. メイン実行
if (fileName) {
    fetch(`./docs/${fileName}.md`)
        .then(res => res.ok ? res.text() : Promise.reject('File Not Found'))
        .then(text => {
            const lines = text.split('\n');
            if (/^[0-9A-F]{6}$/i.test(lines[0].trim())) {
                applyDynamicTheme(lines[0].trim());
                lines.shift();
            }

            let pageTitle = 'No Title';
            let description = '';

            const parsedHtml = lines.join('\n').split(/\n\s*\n/).map(block => {
                const trimmed = block.trim();
                if (!trimmed) return '';
                if (trimmed.startsWith('# ')) {
                    pageTitle = trimmed.replace('# ', '');
                    return `<h1>${pageTitle}</h1>`;
                }
                if (trimmed.startsWith('## ')) return `<h2>${trimmed.replace('## ', '')}</h2>`;
                if (trimmed.startsWith('### ')) return `<h3>${trimmed.replace('### ', '')}</h3>`;
                const content = trimmed.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
                if (!description) description = trimmed.substring(0, 100).replace(/\*/g, '');
                return `<p>${content}</p>`;
            }).join('');

            setupMeta(pageTitle, description);

            output.innerHTML = `
                <img src="./img/${fileName}.webp" class="header-img" onerror="this.style.display='none'">
                <div class="content-inner">${parsedHtml}</div>
                <div class="footer-actions">
                    <button class="back-btn" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">ページ上部へ戻る</button>
                </div>
            `;
            
            // コンテンツ挿入後に一度判定を実行
            handleScroll();
        })
        .catch(err => {
            output.innerHTML = `<div class="content-inner">エラー: ${err}</div>`;
        });
}