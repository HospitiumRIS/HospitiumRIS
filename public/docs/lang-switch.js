/**
 * HospitiumRIS docs language switcher.
 *
 * - Reads/writes the same localStorage key the main app uses (i18nextLng),
 *   so a language chosen in the app navbar carries over into the docs site,
 *   and a language chosen in the docs navbar carries back into the app.
 * - Only redirects automatically once per tab (sessionStorage flag) to avoid
 *   redirect loops if the user deliberately views a page in a non-preferred
 *   language.
 * - Only ever targets pages that actually exist in a given locale. Add new
 *   locale folders/pages first, then include this script on them.
 */
(function () {
  'use strict';

  var SUPPORTED = ['en', 'fr', 'sw'];
  var LANG_NAMES = { en: 'English', fr: 'Français', sw: 'Kiswahili' };
  var STORAGE_KEY = 'i18nextLng';
  var SESSION_FLAG = 'docsLangAutoSynced';

  function getPageLocale() {
    var m = window.location.pathname.match(/\/docs\/(fr|sw)\//);
    return m ? m[1] : 'en';
  }

  function preferredLocale() {
    var pref = null;
    try {
      pref = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      /* localStorage unavailable (private mode, etc.) */
    }
    if (!pref) return 'en';
    var base = pref.split('-')[0];
    return SUPPORTED.indexOf(base) !== -1 ? base : 'en';
  }

  function setPreferredLocale(locale) {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch (e) {
      /* ignore */
    }
  }

  function pathForLocale(locale) {
    var path = window.location.pathname.replace(/\/docs\/(fr|sw)\//, '/docs/');
    if (locale !== 'en') {
      path = path.replace('/docs/', '/docs/' + locale + '/');
    }
    return path;
  }

  function markSynced() {
    try {
      window.sessionStorage.setItem(SESSION_FLAG, '1');
    } catch (e) {
      /* ignore */
    }
  }

  function alreadySynced() {
    try {
      return window.sessionStorage.getItem(SESSION_FLAG) === '1';
    } catch (e) {
      return false;
    }
  }

  function buildSwitcher(pageLocale) {
    var nav = document.querySelector('.navbar');
    if (!nav || document.getElementById('docsLangSwitcher')) return;

    var wrap = document.createElement('div');
    wrap.className = 'lang-switcher';
    wrap.id = 'docsLangSwitcher';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-switcher-btn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      '<span aria-hidden="true">🌐</span> ' +
      (LANG_NAMES[pageLocale] || pageLocale) +
      ' <span class="lang-switcher-caret" aria-hidden="true">▾</span>';

    var menu = document.createElement('div');
    menu.className = 'lang-switcher-menu';
    menu.setAttribute('role', 'menu');

    SUPPORTED.forEach(function (code) {
      var item = document.createElement('a');
      item.href = pathForLocale(code);
      item.textContent = LANG_NAMES[code];
      item.setAttribute('role', 'menuitem');
      if (code === pageLocale) item.className = 'active';
      item.addEventListener('click', function (e) {
        e.preventDefault();
        setPreferredLocale(code);
        markSynced();
        window.location.href = pathForLocale(code);
      });
      menu.appendChild(item);
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function () {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    wrap.appendChild(btn);
    wrap.appendChild(menu);

    var right = nav.querySelector('.navbar-right');
    if (right) {
      right.appendChild(wrap);
    } else {
      nav.appendChild(wrap);
    }
  }

  function init() {
    var pageLocale = getPageLocale();
    var pref = preferredLocale();

    if (pref !== pageLocale && !alreadySynced()) {
      markSynced();
      window.location.replace(pathForLocale(pref));
      return;
    }

    buildSwitcher(pageLocale);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
