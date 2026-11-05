#!/usr/bin/env node
// Builds biblive.app into docs/ (served by GitHub Pages from main:/docs).
// Home pages come from the copy below; legal pages from the app repo's legal/*.md (single source),
// filled with src/legal.json. A legal page that still has an owner placeholder is published as a
// short holding page instead, unless --preview-legal is passed (local review only, never deploy).
// Binary assets (fonts, images, icons) come from src/make_assets.py.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { marked } from 'marked';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'docs');
const LEGAL = join(ROOT, '..', 'dailybible', 'legal');
const ORIGIN = 'https://biblive.app';
const PREVIEW_LEGAL = process.argv.includes('--preview-legal');
const vars = JSON.parse(readFileSync(join(ROOT, 'src/legal.json'), 'utf8'));
const cfg = JSON.parse(readFileSync(join(ROOT, 'src/site.json'), 'utf8'));
// Cache-busting: the stylesheet URL changes whenever its content does.
const cssVersion = createHash('sha256').update(readFileSync(join(ROOT, 'src/site.css'))).digest('hex').slice(0, 8);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const write = (path, html) => {
  const file = join(OUT, path.endsWith('/') ? `${path}index.html` : path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
};

// ---------- icons (24-unit, stroke) ----------
const svg = (body, fill = false) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" fill="${fill ? 'currentColor' : 'none'}" stroke="${fill ? 'none' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const I = {
  play: svg('<path d="M7 4.5v15l12.5-7.5z"/>', true),
  headphones: svg('<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>'),
  book: svg('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  checkBold: svg('<path d="M20 6 9 17l-5-5"/>').replace('stroke-width="2"', 'stroke-width="3"'),
  calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  phone: svg('<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M11 18h2"/>'),
  playStore: svg('<path d="M5 3.5v17L19 12z"/>'),
};
const glyph = (cls = '') =>
  `<svg class="${cls}" viewBox="0 0 1024 1024" aria-hidden="true"><rect width="1024" height="1024" fill="#1F3A5F"/><circle cx="512" cy="445" r="181" fill="#D6A840"/><path fill="#FAF6EE" d="M135 528 507 577v228l-372-31zM519 577l370-49v246l-370 31z"/></svg>`;

// ---------- copy ----------
const T = {
  es: {
    home: '/', other: 'en', otherLabel: 'English', otherShort: 'EN', locale: 'es_ES',
    title: 'Biblive · La Biblia en vídeo, un pasaje cada día',
    description: 'Cada día, un pasaje de la Biblia para ver, escuchar o leer, palabra por palabra y al ritmo del año cristiano. Prueba 7 días gratis.',
    skip: 'Saltar al contenido', navHow: 'Cómo funciona', navPlans: 'Planes', navFaq: 'Preguntas', homeLabel: 'Biblive, inicio',
    launch: cfg.launch.es,
    h1: 'La Biblia, palabra por palabra, un pasaje cada día.',
    lead: 'Un pasaje de la Biblia cada día para ver, escuchar o leer, elegido para el momento del año que vive tu Iglesia. El texto completo, sin resúmenes ni comentarios.',
    soon: 'Próximamente en', getOn: 'Descárgala en', trial: '7 días gratis. Después, suscripción mensual o anual. Sin anuncios.',
    shotHome: 'Pantalla Hoy de Biblive: el pasaje del día con los botones Ver, Escuchar y Leer',
    shotAudio: 'Biblive reproduciendo el pasaje en modo Escuchar',
    howEyebrow: 'Cada día, a tu manera', howTitle: 'Ver, escuchar o leer',
    howText: 'El pasaje del día está listo a medianoche y te espera hasta que lo completes. Elige cómo vivirlo según el momento.',
    ways: [
      ['play', 'Ver', 'La película del pasaje, narrada con las palabras exactas del texto bíblico.'],
      ['headphones', 'Escuchar', 'Sigue sonando con la pantalla apagada: en el coche, caminando o antes de dormir.'],
      ['book', 'Leer', 'El texto completo, versículo a versículo, para leerlo a tu ritmo.'],
    ],
    waysNote: 'Escuchar o leer cuenta igual que ver: el pasaje se da por completado cuando llegas al 90 %.',
    wordEyebrow: 'Nada añadido', wordTitle: 'Palabra por palabra',
    wordText: 'Lo que oyes y lees es el texto de la Biblia, completo y sin cambios. Las imágenes acompañan a la Palabra; no la sustituyen.',
    wordChecks: [
      'Sin resúmenes, sin comentarios y sin frases inventadas.',
      'Cada pasaje se revisa palabra por palabra antes de publicarse.',
      '¿Ves algo que no encaja? Avísanos desde el propio pasaje.',
    ],
    stillAlt: 'Escena del pasaje: un anciano junto al fuego en un patio con ovejas',
    stillTitle: 'La Pascua de Josías', stillRef: '4 Reyes 23:21–25:30 · 14 min',
    yearEyebrow: 'Al ritmo del año', yearTitle: 'El pasaje justo para cada día',
    yearText: 'El pasaje de cada día sigue el calendario cristiano de tu tradición: en Navidad, el nacimiento de Jesús; en Semana Santa, la Pasión; en Pascua, la Resurrección. Todos los de tu misma tradición leen el mismo pasaje el mismo día.',
    seasons: [['violet', 'Adviento'], ['white', 'Navidad'], ['violet', 'Cuaresma'], ['red', 'Semana Santa'], ['white', 'Pascua'], ['green', 'Tiempo ordinario']],
    calEyebrow: 'Tu calendario', calTitle: 'Cada día cuenta',
    calText: 'Tu calendario muestra cómo vas. Si un día no puedes, el pasaje no se pierde: te espera en Pendientes para cuando tengas un momento.',
    weekLabel: 'Ejemplo de los últimos 7 días',
    days: [['Vie', 'g'], ['Sáb', 'g'], ['Dom', 'o'], ['Lun', 'g'], ['Mar', 'x'], ['Mié', 'p'], ['Jue', 't']],
    dayNames: { g: 'completado el mismo día', o: 'completado al día siguiente', x: 'completado más tarde', p: 'pendiente', t: 'hoy' },
    legend: [['g', 'Verde: lo completaste el mismo día'], ['o', 'Naranja: al día siguiente'], ['x', 'Gris: más tarde'], ['p', 'Pendiente: aún te espera'], ['t', 'Hoy']],
    plansEyebrow: 'Dos planes', plansTitle: 'La Biblia completa o solo los Evangelios',
    plansText: 'Elige al empezar y cámbialo en Ajustes cuando quieras. Tu calendario y tu racha se mantienen.',
    plans: [
      ['Biblia completa', 'Del Génesis al Apocalipsis', 'Pasajes de toda la Biblia repartidos a lo largo del año, en el orden que marca el calendario.'],
      ['Evangelios', 'La vida de Jesús', 'Un pasaje de los cuatro Evangelios cada día del año: sus palabras, sus milagros, su Pasión y su Resurrección.'],
    ],
    ctaEyebrow: 'Empieza hoy', ctaTitle: 'Pruébala 7 días gratis',
    ctaText: 'Una semana entera para conocerla, sin pagar. Después, suscripción mensual o anual dentro de la app, sin anuncios. La cancelas cuando quieras desde App Store o Google Play.',
    faqTitle: 'Preguntas frecuentes',
    faq: [
      ['¿Qué pasa si un día no puedo?', 'Nada se pierde. El pasaje queda en Pendientes y en el Archivo, y puedes completarlo cuando quieras. En tu calendario se verá en naranja si lo haces al día siguiente, o en gris si es más tarde.'],
      ['¿Necesito crear una cuenta?', 'No. Puedes empezar sin registrarte. Si inicias sesión, tu progreso se guarda y se sincroniza entre tus dispositivos.'],
      ['¿Cuánto cuesta?', 'Los primeros 7 días son gratis. Después, eliges suscripción mensual o anual; verás el precio de tu país en la app antes de confirmar. Se renueva sola hasta que la canceles desde App Store o Google Play.'],
      ['¿Qué hacéis con mis datos?', 'Lo justo para que la app funcione. Tu tradición solo se guarda si das tu consentimiento, nunca se usa para publicidad y nunca vendemos tus datos. Lo tienes todo en la <a href="/privacidad/">política de privacidad</a>.'],
      ['¿Cómo borro mi cuenta?', 'Desde Ajustes, en la propia app. También te explicamos cómo hacerlo <a href="/eliminar-cuenta/">sin la app</a>.'],
      ['¿Cómo puedo contactar con vosotros?', `Escríbenos a <a href="mailto:${cfg.email.hello}">${cfg.email.hello}</a>. Te respondemos personalmente.`],
    ],
    footAbout: 'La Biblia, palabra por palabra, un pasaje cada día.',
    footLegal: 'Legal', footContact: 'Contacto', footLang: 'Idioma',
    privacy: ['Privacidad', '/privacidad/'], terms: ['Términos', '/terminos/'], del: ['Eliminar cuenta', '/eliminar-cuenta/'],
    press: 'Prensa', hello: 'Escríbenos',
    legal: { privacy: 'privacy', terms: 'terms', 'delete-account': 'delete-account' },
    updated: 'Última actualización', toc: 'En esta página', backHome: 'Volver al inicio',
    hold: {
      privacy: ['Política de privacidad', 'Estamos terminando la versión definitiva de nuestra política de privacidad. La publicaremos en esta página antes del lanzamiento.'],
      terms: ['Términos y condiciones', 'Estamos terminando la versión definitiva de los términos y condiciones de uso. La publicaremos en esta página antes del lanzamiento.'],
      'delete-account': ['Eliminar tu cuenta y tus datos', 'Puedes eliminar tu cuenta desde la app, en Ajustes. Estamos terminando esta página con las instrucciones completas, también para hacerlo sin la app.'],
    },
    holdContact: 'Si tienes cualquier pregunta sobre tus datos, escríbenos a',
    nfTitle: 'Esta página no existe', nfText: 'Puede que el enlace esté mal escrito o que la página se haya movido.',
  },
  en: {
    home: '/en/', other: 'es', otherLabel: 'Español', otherShort: 'ES', locale: 'en_GB',
    title: 'Biblive · The Bible in video, one passage every day',
    description: 'Every day, one passage of the Bible to watch, listen to or read, word for word and in step with the Christian year. Try it free for 7 days.',
    skip: 'Skip to content', navHow: 'How it works', navPlans: 'Plans', navFaq: 'FAQ', homeLabel: 'Biblive, home',
    launch: cfg.launch.en,
    h1: 'The Bible, word for word, one passage every day.',
    lead: 'One passage of the Bible every day to watch, listen to or read, chosen for the season your Church is living. The full text, with no summaries and no commentary.',
    soon: 'Coming soon on', getOn: 'Get it on', trial: '7 days free. Then a monthly or annual subscription. No ads.',
    shotHome: 'The Biblive Today screen: the passage of the day with Watch, Listen and Read buttons',
    shotAudio: 'Biblive playing the passage in Listen mode',
    howEyebrow: 'Every day, your way', howTitle: 'Watch, listen or read',
    howText: 'The passage of the day is ready at midnight and waits for you until you complete it. Choose how to take it in, whatever your day looks like.',
    ways: [
      ['play', 'Watch', 'The film of the passage, narrated with the exact words of the Bible text.'],
      ['headphones', 'Listen', 'Keeps playing with the screen off: in the car, on a walk or before you sleep.'],
      ['book', 'Read', 'The full text, verse by verse, to read at your own pace.'],
    ],
    waysNote: 'Listening or reading counts just like watching: the passage is complete once you reach 90%.',
    wordEyebrow: 'Nothing added', wordTitle: 'Word for word',
    wordText: 'What you hear and read is the text of the Bible, complete and unchanged. The pictures accompany the Word; they never replace it.',
    wordChecks: [
      'No summaries, no commentary and no invented lines.',
      'Every passage is checked word by word before it is published.',
      'Spot something wrong? Tell us from the passage itself.',
    ],
    stillAlt: 'A scene from the passage: an old man by a fire in a courtyard with sheep',
    stillTitle: 'The Passover of Josiah', stillRef: '2 Kings 23:21–25:30 · 14 min',
    yearEyebrow: 'In step with the year', yearTitle: 'The right passage for every day',
    yearText: "Each day's passage follows the Christian calendar of your tradition: the birth of Jesus at Christmas, the Passion in Holy Week, the Resurrection at Easter. Everyone in your tradition reads the same passage on the same day.",
    seasons: [['violet', 'Advent'], ['white', 'Christmas'], ['violet', 'Lent'], ['red', 'Holy Week'], ['white', 'Easter'], ['green', 'Ordinary Time']],
    calEyebrow: 'Your calendar', calTitle: 'Every day counts',
    calText: "Your calendar shows how you're doing. If you miss a day, the passage isn't lost: it waits for you in Catch-up until you have a moment.",
    weekLabel: 'Example of the last 7 days',
    days: [['Fri', 'g'], ['Sat', 'g'], ['Sun', 'o'], ['Mon', 'g'], ['Tue', 'x'], ['Wed', 'p'], ['Thu', 't']],
    dayNames: { g: 'completed on the day', o: 'completed the next day', x: 'completed later', p: 'pending', t: 'today' },
    legend: [['g', 'Green: completed on the day'], ['o', 'Orange: the next day'], ['x', 'Grey: later'], ['p', 'Pending: still waiting for you'], ['t', 'Today']],
    plansEyebrow: 'Two plans', plansTitle: 'The whole Bible or just the Gospels',
    plansText: 'Choose when you start and switch in Settings whenever you like. Your calendar and streak stay with you.',
    plans: [
      ['Whole Bible', 'From Genesis to Revelation', 'Passages from the whole Bible spread across the year, in the order the calendar sets.'],
      ['Gospels', 'The life of Jesus', 'One passage from the four Gospels every day of the year: his words, his miracles, his Passion and his Resurrection.'],
    ],
    ctaEyebrow: 'Start today', ctaTitle: 'Try it free for 7 days',
    ctaText: "A whole week to get to know it, free. Then a monthly or annual subscription inside the app, with no ads. Cancel any time from the App Store or Google Play.",
    faqTitle: 'Frequently asked questions',
    faq: [
      ["What if I can't make it one day?", "Nothing is lost. The passage stays in Catch-up and in the Archive, and you can complete it whenever you like. Your calendar shows it in orange if you do it the next day, or in grey if later."],
      ['Do I need an account?', 'No. You can start without signing up. If you sign in, your progress is saved and synced across your devices.'],
      ['How much does it cost?', "The first 7 days are free. Then you choose a monthly or annual subscription; you'll see the price for your country in the app before you confirm. It renews automatically until you cancel it from the App Store or Google Play."],
      ['What do you do with my data?', 'Only what the app needs to work. Your tradition is stored only with your consent, it is never used for advertising and we never sell your data. The details are in the <a href="/en/privacy/">privacy policy</a>.'],
      ['How do I delete my account?', 'From Settings, inside the app. We also explain how to do it <a href="/en/delete-account/">without the app</a>.'],
      ['How can I contact you?', `Write to <a href="mailto:${cfg.email.hello}">${cfg.email.hello}</a>. A person will reply.`],
    ],
    footAbout: 'The Bible, word for word, one passage every day.',
    footLegal: 'Legal', footContact: 'Contact', footLang: 'Language',
    privacy: ['Privacy', '/en/privacy/'], terms: ['Terms', '/en/terms/'], del: ['Delete account', '/en/delete-account/'],
    press: 'Press', hello: 'Write to us',
    updated: 'Last updated', toc: 'On this page', backHome: 'Back to home',
    hold: {
      privacy: ['Privacy policy', "We're finishing the final version of our privacy policy. It will be published on this page before launch."],
      terms: ['Terms of use', "We're finishing the final version of our terms of use. They will be published on this page before launch."],
      'delete-account': ['Delete your account and data', "You can delete your account in the app, under Settings. We're finishing this page with full instructions, including how to do it without the app."],
    },
    holdContact: 'If you have any question about your data, write to',
    nfTitle: "This page doesn't exist", nfText: 'The link may be mistyped, or the page may have moved.',
  },
};

// Legal page paths per language; the counterpart in the other language is the same key.
const LEGAL_PATHS = {
  es: { privacy: '/privacidad/', terms: '/terminos/', 'delete-account': '/eliminar-cuenta/' },
  en: { privacy: '/en/privacy/', terms: '/en/terms/', 'delete-account': '/en/delete-account/' },
};

// ---------- layout ----------
function head(lang, { title, description, path, alt, noindex = false }) {
  const t = T[lang];
  const alts = alt
    ? `<link rel="alternate" hreflang="${lang}" href="${ORIGIN}${path}"><link rel="alternate" hreflang="${t.other}" href="${ORIGIN}${alt}"><link rel="alternate" hreflang="x-default" href="${ORIGIN}${lang === 'es' ? path : alt}">`
    : '';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self'; font-src 'self'; script-src 'none'; manifest-src 'self'; base-uri 'self'; form-action 'none'; object-src 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${ORIGIN}${path}">`}
${alts}
<meta name="theme-color" content="#F7F4EE" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0F1726" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Biblive">
<meta property="og:locale" content="${t.locale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${ORIGIN}${path}">
<meta property="og:image" content="${ORIGIN}/img/og-${lang}.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/fonts/literata-600semibold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-400regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/site.css?v=${cssVersion}">
</head>`;
}

function header(lang, alt, sections = true) {
  const t = T[lang];
  const sect = sections
    ? `<a class="sect" href="${t.home}#como-funciona">${t.navHow}</a><a class="sect" href="${t.home}#planes">${t.navPlans}</a><a class="sect" href="${t.home}#preguntas">${t.navFaq}</a>`
    : '';
  return `<body>
<a class="skip" href="#main">${t.skip}</a>
<header class="top"><div class="wrap">
<a class="brand" href="${t.home}" aria-label="${t.homeLabel}">${glyph()}<span>Biblive</span></a>
<nav aria-label="${lang === 'es' ? 'Principal' : 'Main'}">${sect}<a class="lang" href="${alt}" hreflang="${t.other}" lang="${t.other}" aria-label="${t.otherLabel}">${t.otherShort}</a></nav>
</div></header>`;
}

function stores(lang) {
  const t = T[lang];
  return ['ios', 'android']
    .map((k) => {
      const url = cfg.stores[k];
      const [icon, name] = k === 'ios' ? [I.phone, 'App Store'] : [I.playStore, 'Google Play'];
      const inner = `${icon}<span><small>${url ? t.getOn : t.soon}</small><strong>${name}</strong></span>`;
      return url
        ? `<a class="store" href="${esc(url)}" rel="noopener">${inner}</a>`
        : `<div class="store soon" role="img" aria-label="${t.soon} ${name}">${inner}</div>`;
    })
    .join('');
}

function footer(lang, alt) {
  const t = T[lang];
  const link = ([label, href]) => `<li><a href="${href}">${label}</a></li>`;
  return `<footer><div class="wrap">
<div class="cols">
<div class="about"><a class="brand" href="${t.home}" aria-label="${t.homeLabel}">${glyph()}<span>Biblive</span></a><p class="tag">${t.footAbout}</p></div>
<div><h2>${t.footLegal}</h2><ul>${link(t.privacy)}${link(t.terms)}${link(t.del)}</ul></div>
<div><h2>${t.footContact}</h2><ul><li><a href="mailto:${cfg.email.hello}">${t.hello}</a></li><li><a href="mailto:${cfg.email.press}">${t.press}</a></li></ul></div>
<div><h2>${t.footLang}</h2><ul><li><a href="${lang === 'es' ? '#' : alt}" ${lang === 'es' ? 'aria-current="page"' : 'hreflang="es" lang="es"'}>Español</a></li><li><a href="${lang === 'en' ? '#' : alt}" ${lang === 'en' ? 'aria-current="page"' : 'hreflang="en" lang="en"'}>English</a></li></ul></div>
</div>
<p class="copy">© ${new Date().getFullYear()} Biblive</p>
</div></footer>
</body>
</html>
`;
}

// ---------- home ----------
function home(lang) {
  const t = T[lang];
  const alt = T[t.other].home;
  const path = t.home;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', name: 'Biblive', url: ORIGIN, logo: `${ORIGIN}/icon-512.png`, email: cfg.email.hello },
      { '@type': 'WebSite', name: 'Biblive', url: ORIGIN, inLanguage: lang },
    ],
  };
  const dot = (k, small = false) => `<span class="dot ${k}">${k === 'g' || k === 'o' || k === 'x' ? I.checkBold : ''}</span>`;
  return `${head(lang, { title: t.title, description: t.description, path, alt })}
${header(lang, alt)}
<main id="main">
<section class="hero"><div class="wrap">
  <div>
    <p class="pill">${I.calendar}${t.launch}</p>
    <h1>${t.h1}</h1>
    <p class="lead">${t.lead}</p>
    <div class="stores">${stores(lang)}</div>
    <p class="note">${t.trial}</p>
  </div>
  <div class="phones">
    <div class="phone back"><img src="/img/app-escuchar-360.webp" srcset="/img/app-escuchar-360.webp 360w, /img/app-escuchar-720.webp 720w" sizes="(max-width:860px) 50vw, 220px" width="360" height="727" alt="${esc(t.shotAudio)}" fetchpriority="low"></div>
    <div class="phone front"><img src="/img/app-hoy-360.webp" srcset="/img/app-hoy-360.webp 360w, /img/app-hoy-720.webp 720w" sizes="(max-width:860px) 58vw, 256px" width="360" height="727" alt="${esc(t.shotHome)}" fetchpriority="high"></div>
  </div>
</div></section>

<section id="como-funciona" class="alt"><div class="wrap">
  <div class="head"><p class="eyebrow">${t.howEyebrow}</p><h2>${t.howTitle}</h2><p>${t.howText}</p></div>
  <div class="cards">${t.ways.map(([i, h, p]) => `<article class="card"><div class="icon">${I[i]}</div><h3>${h}</h3><p>${p}</p></article>`).join('')}</div>
  <p class="callout">${I.check}<span>${t.waysNote}</span></p>
</div></section>

<section><div class="wrap split">
  <figure class="still media">
    <img src="/img/pasaje-480.webp" srcset="/img/pasaje-480.webp 480w, /img/pasaje-960.webp 960w" sizes="(max-width:860px) 100vw, 528px" width="480" height="270" alt="${esc(t.stillAlt)}" loading="lazy">
    <figcaption><b>${t.stillTitle}</b>${t.stillRef}</figcaption>
  </figure>
  <div>
    <p class="eyebrow">${t.wordEyebrow}</p><h2>${t.wordTitle}</h2><p>${t.wordText}</p>
    <ul class="checks">${t.wordChecks.map((c) => `<li>${I.check}<span>${c}</span></li>`).join('')}</ul>
  </div>
</div></section>

<section class="alt"><div class="wrap split rev">
  <div class="media">
    <div class="week" role="group" aria-label="${t.weekLabel}">
      <ul class="days">${t.days.map(([d, k]) => `<li><span aria-hidden="true">${d}</span>${dot(k)}<span class="sr">${d}: ${t.dayNames[k]}</span></li>`).join('')}</ul>
      <ul class="legend">${t.legend.map(([k, l]) => `<li>${dot(k)}<span>${l}</span></li>`).join('')}</ul>
    </div>
  </div>
  <div>
    <p class="eyebrow">${t.calEyebrow}</p><h2>${t.calTitle}</h2><p>${t.calText}</p>
  </div>
</div></section>

<section class="center"><div class="wrap">
  <div class="head"><p class="eyebrow">${t.yearEyebrow}</p><h2>${t.yearTitle}</h2><p>${t.yearText}</p>
  <ul class="seasons">${t.seasons.map(([c, s]) => `<li><i class="s-${c}"></i>${s}</li>`).join('')}</ul></div>
</div></section>

<section id="planes" class="alt"><div class="wrap">
  <div class="head"><p class="eyebrow">${t.plansEyebrow}</p><h2>${t.plansTitle}</h2><p>${t.plansText}</p></div>
  <div class="plans">${t.plans.map(([h, e, p]) => `<article class="plan"><p class="eyebrow">${e}</p><h3>${h}</h3><p>${p}</p></article>`).join('')}</div>
</div></section>

<section class="cta"><div class="wrap">
  ${glyph('glyph')}
  <div><p class="eyebrow">${t.ctaEyebrow}</p><h2>${t.ctaTitle}</h2><p>${t.ctaText}</p><div class="stores">${stores(lang)}</div></div>
</div></section>

<section id="preguntas"><div class="wrap faq">
  <div class="head"><h2>${t.faqTitle}</h2></div>
  ${t.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('\n  ')}
</div></section>
</main>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${footer(lang, alt)}`;
}

// ---------- legal ----------
const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const longDate = (iso, lang) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const held = [];
function legal(lang, key) {
  const t = T[lang];
  const path = LEGAL_PATHS[lang][key];
  const alt = LEGAL_PATHS[t.other][key];
  const src = readFileSync(join(LEGAL, lang, `${key}.md`), 'utf8').replace(/\r\n/g, '\n');
  const [, front, md] = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const fm = Object.fromEntries(front.split('\n').map((l) => l.split(/:\s*(.*)/s).slice(0, 2)));
  const filled = md.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
  const pending = /owner to provide|\{\{\w+\}\}/.test(filled);
  let body;
  let title;
  if (pending && !PREVIEW_LEGAL) {
    held.push(`${lang}/${key}`);
    [title] = t.hold[key];
    body = `<h1>${title}</h1><div class="hold"><p>${t.hold[key][1]}</p><p>${t.holdContact} <a href="mailto:${vars.PRIVACY_EMAIL}">${vars.PRIVACY_EMAIL}</a>.</p></div><p class="back"><a href="${t.home}">${t.backHome}</a></p>`;
  } else {
    let html = marked.parse(filled.replace(/^# .*\n/m, ''));
    const toc = [];
    html = html
      .replace(/<h2>(.*?)<\/h2>/g, (_, h) => {
        const id = slug(h.replace(/<[^>]+>/g, ''));
        toc.push(`<li><a href="#${id}">${h}</a></li>`);
        return `<h2 id="${id}">${h}</h2>`;
      })
      // Label every cell with its column header, so narrow screens can show each row as a card.
      .replace(/<table>([\s\S]*?)<\/table>/g, (_, inner) => {
        const heads = [...inner.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => esc(m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()));
        const rows = inner.replace(/<tr>([\s\S]*?)<\/tr>/g, (_, cells) => {
          let i = 0;
          return `<tr>${cells.replace(/<td([^>]*)>/g, (_, attrs) => `<td${attrs} data-label="${heads[i++] ?? ''}">`)}</tr>`;
        });
        return `<div class="table"><table>${rows}</table></div>`;
      });
    title = fm.title.replace(/\{\{BRAND\}\}/g, 'Biblive');
    body = `<h1>${esc(title)}</h1><p class="meta">${t.updated}: ${longDate(fm.updated, lang)}</p>
${toc.length > 2 ? `<details class="toc"><summary>${t.toc}</summary><ul>${toc.join('')}</ul></details>` : ''}
${html}`;
  }
  return `${head(lang, { title: `${title} · Biblive`, description: `${title} · Biblive`, path, alt, noindex: pending && !PREVIEW_LEGAL })}
${header(lang, alt, false)}
<main id="main" class="wrap doc">
${body}
</main>
${footer(lang, alt)}`;
}

function notFound() {
  const t = T.es;
  return `${head('es', { title: `${t.nfTitle} · Biblive`, description: t.nfText, path: '/404.html', noindex: true })}
${header('es', '/en/', false)}
<main id="main" class="wrap notfound">
<p class="eyebrow">404</p><h1>${t.nfTitle}</h1><p class="lead">${t.nfText}</p>
<p><a href="/">${t.backHome}</a> · <a href="/en/" lang="en">Back to home (English)</a></p>
</main>
${footer('es', '/en/')}`;
}

// ---------- write ----------
for (const lang of ['es', 'en']) {
  write(T[lang].home, home(lang));
  for (const key of Object.keys(LEGAL_PATHS[lang])) write(LEGAL_PATHS[lang][key], legal(lang, key));
}
write('404.html', notFound());
copyFileSync(join(ROOT, 'src/site.css'), join(OUT, 'site.css'));
write('favicon.svg', glyph().replace('class=""', 'xmlns="http://www.w3.org/2000/svg"'));
write(
  'site.webmanifest',
  JSON.stringify({
    name: 'Biblive', short_name: 'Biblive', start_url: '/', display: 'browser',
    background_color: '#F7F4EE', theme_color: '#1F3A5F',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
  }, null, 2),
);
const indexable = ['/', '/en/', ...(PREVIEW_LEGAL ? [] : Object.values(LEGAL_PATHS).flatMap((p) => Object.entries(p)).filter(([k]) => !held.some((h) => h.endsWith(`/${k}`))).map(([, v]) => v))];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((p) => `  <url><loc>${ORIGIN}${p}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
write('CNAME', 'biblive.app\n');
write('.nojekyll', '');
console.log(`built docs/${held.length ? `; holding pages (owner placeholders): ${held.join(', ')}` : ''}${PREVIEW_LEGAL ? ' [PREVIEW: do not deploy]' : ''}`);
