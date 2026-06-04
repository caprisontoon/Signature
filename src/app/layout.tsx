import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SVIP 시그니처 이펙트 스튜디오 · TOONATION",
  description: "투네이션 SVIP 시그니처 이펙트 스튜디오",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" data-theme="light">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&family=Caveat:wght@400;500;600;700&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Allura&family=Sacramento&family=Pinyon+Script&family=Homemade+Apple&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Load gif.js with CDN fallback */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function loadGifLib() {
  var urls = [
    'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js',
    'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js',
    'https://unpkg.com/gif.js@0.2.0/dist/gif.js'
  ];
  var idx = 0;
  function tryNext() {
    if (idx >= urls.length) { console.error('All gif.js CDNs failed to load.'); return; }
    var s = document.createElement('script');
    s.src = urls[idx++];
    s.onload = function() { console.log('gif.js loaded:', s.src); };
    s.onerror = function() { console.warn('gif.js failed:', s.src); tryNext(); };
    document.head.appendChild(s);
  }
  tryNext();
})();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <div id="toast" className="toast"></div>
      </body>
    </html>
  );
}
