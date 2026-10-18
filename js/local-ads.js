(function () {
  'use strict';

  var ads = [
    {
      image: './img/ads/miiverse.png',
      link: 'https://miiverse.projectrose.cafe/',
      alt: 'Miiverse'
    }
  ];

  function renderAd() {
    var slot = document.getElementById('nowtube-ad-slot');
    var inner = slot && slot.querySelector('.nowtube-ad-inner');
    if (!slot || !inner) return;

    if (!ads.length) {
      inner.innerHTML = '<div class="nowtube-local-ad-placeholder">ローカル広告を設定してください（js/local-ads.js の ads 配列）</div>';
      return;
    }

    var ad = ads[Math.floor(Math.random() * ads.length)];
    if (!ad || !ad.image || !ad.link) {
      inner.textContent = '広告の設定を確認してください。';
      return;
    }

    var link = document.createElement('a');
    link.className = 'nowtube-local-ad-link';
    link.href = ad.link;
    link.setAttribute('aria-label', '広告を開く');
    if (/^https?:\/\//i.test(ad.link)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }

    var img = document.createElement('img');
    img.className = 'nowtube-local-ad-image';
    img.src = ad.image;
    img.alt = ad.alt || '広告';
    img.loading = 'eager';
    img.onerror = function () {
      inner.textContent = '広告画像を読み込めません。js/local-ads.js の画像パスを確認してください。';
    };

    link.appendChild(img);
    inner.replaceChildren(link);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAd);
  } else {
    renderAd();
  }
})();
