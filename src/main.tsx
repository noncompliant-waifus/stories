import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import pages from './pages.json';
import './style.css';

type Language = 'ru' | 'en';
const base = import.meta.env.BASE_URL;
const copy = {
  en: {
    archive: 'The manga archive', intro: 'Real capsuleers. Real trouble.',
    description: 'The adventures of Lala Deviluke, inspired by real events in EVE Online. Somewhere in New Eden, a perfectly good plan is about to go very wrong.',
    read: 'Read volume 01', resume: 'Continue reading', volume: 'Volume 01', pages: 'pages',
    download: 'Download PDF', available: 'Available in English & Russian',
    notice: 'Strong language, fictional violence and dark humor.',
    back: 'All volumes', page: 'Page', of: 'of', end: 'End of volume 01',
    endText: 'You made it through New Eden. Fly safe.', start: 'Read from the beginning',
    footer: 'An independent, non-commercial fan manga. Not affiliated with or endorsed by CCP Games.',
    rights: 'EVE Online and associated names, ships, designs, artwork, trademarks and other game content belong to CCP Games and their respective owners. This material is used with limited permission of CCP Games. References to other fictional works and characters remain the property of their respective rights holders. No rights to third-party intellectual property are claimed.',
    terms: 'EVE Online Content Creation Terms of Use', skip: 'Skip to content',
    fail: 'This page could not be loaded.', retry: 'Try again',
  },
  ru: {
    archive: 'Архив манги', intro: 'Настоящие капсулёры. Настоящие проблемы.',
    description: 'Приключения Лалы Девилюк, вдохновлённые реальными событиями в EVE Online. Где-то в Новом Эдеме безупречный план вот-вот пойдёт совсем не так.',
    read: 'Читать том 01', resume: 'Продолжить чтение', volume: 'Том 01', pages: 'страниц',
    download: 'Скачать PDF', available: 'На русском и английском',
    notice: 'Ненормативная лексика, вымышленное насилие и чёрный юмор.',
    back: 'Все тома', page: 'Страница', of: 'из', end: 'Конец тома 01',
    endText: 'Вы пережили ещё одно приключение в Новом Эдеме. Fly safe.', start: 'Читать с начала',
    footer: 'Независимая некоммерческая фан-манга. Проект не связан с CCP Games и не одобрен компанией.',
    rights: 'EVE Online и связанные названия, корабли, дизайн, иллюстрации, товарные знаки и другой игровой контент принадлежат CCP Games и соответствующим правообладателям. Материалы используются с ограниченного разрешения CCP Games. Упоминания других произведений и персонажей остаются собственностью их правообладателей. Проект не претендует на права на чужую интеллектуальную собственность.',
    terms: 'Условия создания контента EVE Online', skip: 'Перейти к содержимому',
    fail: 'Не удалось загрузить страницу.', retry: 'Повторить',
  },
};

function readSaved(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function save(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Reading works without storage. */ }
}
function validPage(value: string | null, language: Language) {
  const number = Number(value);
  return Number.isInteger(number) ? Math.max(1, Math.min(pages[language].length, number)) : 1;
}
function route() {
  const params = new URLSearchParams(location.hash.slice(1));
  const preference = params.get('lang') ?? readSaved('language') ?? navigator.language;
  const language: Language = preference.startsWith('ru') ? 'ru' : 'en';
  return { language, reading: params.get('volume') === '1', page: validPage(params.get('page'), language) };
}
function url(language: Language, reading: boolean, page = 1) {
  return `#lang=${language}${reading ? `&volume=1&page=${page}` : ''}`;
}

function MangaPage({ page, number, language, eager }: { page: typeof pages.en[number]; number: number; language: Language; eager: boolean }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const t = copy[language];
  return <figure id={`page-${number}`} className="manga-page" style={{ aspectRatio: `${page.width} / ${page.height}` }}>
    {failed ? <div className="image-error"><p>{t.fail}</p><button onClick={() => { setFailed(false); setAttempt(attempt + 1); }}>{t.retry}</button></div>
      : <img key={attempt} src={`${base}${page.src}${attempt ? `?retry=${attempt}` : ''}`} width={page.width} height={page.height} loading={eager ? 'eager' : 'lazy'} decoding="async" alt={`${t.volume} · ${t.page} ${number}`} onError={() => setFailed(true)} />}
    <figcaption>{String(number).padStart(2, '0')}</figcaption>
  </figure>;
}

function App() {
  const [view, setView] = useState(route);
  const [current, setCurrent] = useState(view.page);
  const currentRef = useRef(current);
  const t = copy[view.language];
  const list = pages[view.language];
  const saved = validPage(readSaved('vol-1-page'), view.language);
  const pdf = `${base}downloads/Lala_Deviluke_Vol_1_${view.language.toUpperCase()}.pdf`;

  useEffect(() => {
    const onHash = () => setView(route());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.lang = view.language;
    document.title = `${view.reading ? `${t.volume} · ` : ''}Lala Deviluke · New Eden Stories`;
    save('language', view.language);
    setCurrent(view.page);
    currentRef.current = view.page;
    if (view.reading) document.getElementById(`page-${view.page}`)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [view, t.volume]);

  useEffect(() => {
    if (!view.reading) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const elements = [...document.querySelectorAll<HTMLElement>('.manga-page')];
      let visible = 1;
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].getBoundingClientRect().top <= window.innerHeight * 0.4) visible = i + 1;
        else break;
      }
      currentRef.current = visible;
      setCurrent(visible);
      save('vol-1-page', String(visible));
      history.replaceState(null, '', url(view.language, true, visible));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [view]);

  function jump(page: number) {
    requestAnimationFrame(() => document.getElementById(`page-${page}`)?.scrollIntoView());
  }

  return <>
    <a className="skip" href="#content" onClick={event => { event.preventDefault(); document.getElementById('content')?.focus(); }}>{t.skip}</a>
    <header className="header">
      <a className="brand" href={url(view.language, false)} aria-label="New Eden Stories"><span className="brand-mark">N<span>↗</span></span><span>NEW EDEN<span className="brand-sub">STORIES / FAN MANGA</span></span></a>
      <nav aria-label="Language" className="languages">{(['en', 'ru'] as const).map(language => <a key={language} lang={language} aria-label={language === 'en' ? 'English' : 'Русский'} aria-current={view.language === language ? 'true' : undefined} href={url(language, view.reading, currentRef.current)}>{language.toUpperCase()}</a>)}</nav>
    </header>

    <main id="content" tabIndex={-1}>
      {view.reading ? <>
        <div className="reader-toolbar">
          <a href={url(view.language, false)}>← <span>{t.back}</span></a>
          <label>{t.page} <select aria-label={t.page} value={current} onChange={event => jump(Number(event.target.value))}>{list.map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select> / {list.length}</label>
          <a className="pdf-link" href={pdf} download>PDF ↓</a>
          <div className="progress" style={{ width: `${current / list.length * 100}%` }} />
        </div>
        <div className="reader" key={view.language}>{list.map((page, index) => <MangaPage key={page.src} page={page} number={index + 1} language={view.language} eager={Math.abs(index + 1 - view.page) <= 1} />)}</div>
        <section className="end"><span className="eyebrow">TRANSMISSION COMPLETE</span><h1>{t.end}</h1><p>{t.endText}</p><a className="button" href={url(view.language, false)}>{t.back} ↗</a><button className="text-button" onClick={() => jump(1)}>{t.start}</button></section>
      </> : <div className="home">
        <section className="hero">
          <div className="hero-copy"><p className="eyebrow"><span className="live-dot" /> EVE ONLINE · FAN MANGA</p><h1>LALA<br /><span>DEVILUKE</span><span className="title-period">.</span></h1><p className="intro">{t.intro}</p><p className="description">{t.description}</p><a className="button" href={url(view.language, true, saved)}>{saved > 1 ? t.resume : t.read}<span>↗</span></a><p className="availability">{t.available}</p></div>
          <a className="hero-art" href={url(view.language, true, saved)} aria-label={t.read}><div className="orbit orbit-one" /><div className="orbit orbit-two" /><span className="coordinates">NEW EDEN / CAPSULEER ARCHIVES</span><img src={`${base}manga/vol-1/${view.language}/cover.webp`} width={480} height={720} alt={`Lala Deviluke · ${t.volume}`} fetchPriority="high" /><span className="art-label">LOG_001 <span>● ONLINE</span></span></a>
        </section>
        <section className="library"><div className="section-heading"><h2>{t.archive}</h2><span>01 / 01</span></div><article className="volume-card"><a className="cover-small" href={url(view.language, true)} tabIndex={-1} aria-hidden="true"><img src={`${base}manga/vol-1/${view.language}/cover.webp`} alt="" width={480} height={720} loading="lazy" /></a><div className="volume-info"><p className="eyebrow">LALA DEVILUKE</p><h3>{t.volume}</h3><p className="muted">{list.length} {t.pages} <span className="separator">/</span> RU + EN</p><a className="text-link" href={url(view.language, true)}>{t.read} ↗</a></div><a className="download" href={pdf} download>{t.download} ↓<span>~59 MB</span></a></article></section>
        <p className="content-notice"><span>!</span>{t.notice}</p>
      </div>}
    </main>
    <footer><div className="footer-top"><span className="footer-brand">NEW EDEN STORIES</span><span>NEW EDEN IS DANGEROUS. FLY SAFE. ↗</span></div><p>{t.footer}</p><details><summary>CCP Games / {view.language === 'ru' ? 'Права на материалы' : 'Content credits'}</summary><p>{t.rights}</p><a href="https://support.eveonline.com/hc/en-us/articles/8563917741084-EVE-Online-Content-Creation-Terms-of-Use">{t.terms} ↗</a></details></footer>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
