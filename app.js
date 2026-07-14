const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;
const BIWEEKLY_PER_YEAR = 26;
const MAX_CARDS = 4;

const BASE = 'USD';
const RATES_CACHE_KEY = 'salary_rates';
const RATES_TTL = 6 * 60 * 60 * 1000;
const SYMBOLS = { USD: '$', EUR: '\u20AC', GBP: '\u00A3', BRL: 'R$', JPY: '\u00A5', CAD: '$', AUD: '$' };

let rates = { USD: 1 };
let salaryAnnualBase = 0;

const work = {
  hoursPerWeek: 40,
  daysPerWeek: 5,
};

const hoursInput = document.getElementById('hoursPerWeek');
const daysInput = document.getElementById('daysPerWeek');
const cardsContainer = document.getElementById('cardsContainer');
const ratesNote = document.getElementById('ratesNote');

function toAnnual(period, value) {
  switch (period) {
    case 'hourly':   return value * work.hoursPerWeek * WEEKS_PER_YEAR;
    case 'daily':    return value * work.daysPerWeek * WEEKS_PER_YEAR;
    case 'weekly':   return value * WEEKS_PER_YEAR;
    case 'biweekly': return value * BIWEEKLY_PER_YEAR;
    case 'monthly':  return value * MONTHS_PER_YEAR;
    case 'annual':   return value;
    default:         return 0;
  }
}

function fromAnnual(period, annual) {
  switch (period) {
    case 'hourly':   return work.hoursPerWeek ? annual / WEEKS_PER_YEAR / work.hoursPerWeek : 0;
    case 'daily':    return work.daysPerWeek ? annual / WEEKS_PER_YEAR / work.daysPerWeek : 0;
    case 'weekly':   return annual / WEEKS_PER_YEAR;
    case 'biweekly': return annual / BIWEEKLY_PER_YEAR;
    case 'monthly':  return annual / MONTHS_PER_YEAR;
    case 'annual':   return annual;
    default:         return 0;
  }
}

function fmt(n) {
  if (!isFinite(n) || n === 0) return '';
  return Math.round(n * 100) / 100;
}

function toBase(currency, value) {
  const rate = rates[currency];
  return rate ? value / rate : value;
}

function fromBase(currency, value) {
  const rate = rates[currency];
  return rate ? value * rate : value;
}

function repaintCard(card, skipEl) {
  const currency = getCardCurrency(card);
  const annual = fromBase(currency, salaryAnnualBase);
  card.querySelectorAll('.salary-grid input').forEach((input) => {
    if (input === skipEl) return;
    input.value = fmt(fromAnnual(input.dataset.period, annual));
  });
  const symbol = SYMBOLS[currency] || '$';
  card.querySelectorAll('.input-wrap').forEach((wrap) => {
    const prefix = wrap.querySelector('.prefix');
    const input = wrap.querySelector('input');
    prefix.textContent = symbol;
    input.style.paddingLeft = (prefix.offsetWidth + 20) + 'px';
  });
}

function repaintAll(skipEl) {
  cardsContainer.querySelectorAll('.salary-card').forEach((card) => repaintCard(card, skipEl));
}

function getCardCurrency(card) {
  return card.querySelector('.currency-code').textContent;
}

function setCardCurrency(card, code) {
  card.querySelector('.currency-code').textContent = code;
  card.querySelectorAll('.currency-list li').forEach((li) => {
    li.setAttribute('aria-selected', li.dataset.code === code);
  });
}

function closeAllCurrencies() {
  cardsContainer.querySelectorAll('.currency-selector.open').forEach((selector) => {
    selector.classList.remove('open');
    selector.querySelector('.currency-trigger').setAttribute('aria-expanded', 'false');
  });
}

function initCurrency(card) {
  const selector = card.querySelector('.currency-selector');
  const trigger = selector.querySelector('.currency-trigger');
  const list = selector.querySelector('.currency-list');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = selector.classList.contains('open');
    closeAllCurrencies();
    if (!isOpen) {
      selector.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });

  list.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    setCardCurrency(card, li.dataset.code);
    closeAllCurrencies();
    repaintCard(card, null);
  });

  setCardCurrency(card, getCardCurrency(card));
}

function initInputs(card) {
  card.querySelectorAll('.salary-grid input').forEach((input) => {
    input.addEventListener('input', () => {
      const value = parseFloat(input.value) || 0;
      const annual = toAnnual(input.dataset.period, value);
      salaryAnnualBase = toBase(getCardCurrency(card), annual);
      repaintAll(input);
    });
  });
}

function updateAddButtons() {
  const count = cardsContainer.querySelectorAll('.salary-card').length;
  cardsContainer.classList.remove('count-1', 'count-2', 'count-3', 'count-4');
  cardsContainer.classList.add('count-' + count);
  cardsContainer.querySelectorAll('.add-card').forEach((btn) => {
    btn.disabled = count >= MAX_CARDS;
  });
}

function addCard() {
  const cards = cardsContainer.querySelectorAll('.salary-card');
  if (cards.length >= MAX_CARDS) return;

  const first = cards[0];
  const clone = first.cloneNode(true);

  clone.querySelectorAll('.salary-grid input').forEach((input) => {
    input.value = '';
    input.removeAttribute('id');
  });
  clone.querySelectorAll('.salary-grid label').forEach((label) => label.removeAttribute('for'));
  clone.querySelector('.currency-selector').classList.remove('open');

  const btn = clone.querySelector('.add-card');
  btn.classList.remove('add-card');
  btn.classList.add('remove-card');
  btn.title = 'Remove currency';
  btn.setAttribute('aria-label', 'Remove currency');
  btn.disabled = false;
  btn.querySelector('svg').innerHTML = '<path d="M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/>';

  cardsContainer.appendChild(clone);
  initCard(clone);
  setCardCurrency(clone, getCardCurrency(first));
  repaintCard(clone, null);
  updateAddButtons();
}

function removeCard(card) {
  card.remove();
  updateAddButtons();
}

function initCard(card) {
  initCurrency(card);
  initInputs(card);
  const addBtn = card.querySelector('.add-card');
  if (addBtn) addBtn.addEventListener('click', addCard);
  const removeBtn = card.querySelector('.remove-card');
  if (removeBtn) removeBtn.addEventListener('click', () => removeCard(card));
}

cardsContainer.querySelectorAll('.salary-card').forEach(initCard);
updateAddButtons();

document.addEventListener('click', (e) => {
  if (e.target.closest('.currency-selector')) return;
  closeAllCurrencies();
});

function onWorkChange() {
  work.hoursPerWeek = parseFloat(hoursInput.value) || 0;
  work.daysPerWeek = parseFloat(daysInput.value) || 0;
  repaintAll(null);
}

hoursInput.addEventListener('input', onWorkChange);
daysInput.addEventListener('input', onWorkChange);

const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  const light = theme === 'light';
  document.body.classList.toggle('light', light);
  themeToggle.innerHTML = light ? '&#9790; Night' : '&#9728; Day';
}

themeToggle.addEventListener('click', () => {
  const next = document.body.classList.contains('light') ? 'dark' : 'light';
  localStorage.setItem('salary_theme', next);
  applyTheme(next);
});

applyTheme(localStorage.getItem('salary_theme') || 'dark');

function currencyCodes() {
  const set = new Set();
  cardsContainer.querySelectorAll('.currency-list li').forEach((li) => set.add(li.dataset.code));
  return [...set];
}

function setRatesNote(text, isError) {
  ratesNote.textContent = text;
  ratesNote.classList.toggle('error', !!isError);
}

function applyRates(data, cached) {
  rates = Object.assign({ [BASE]: 1 }, data.rates);
  const when = new Date(data.date + 'T00:00:00');
  const dateStr = isNaN(when) ? data.date : when.toLocaleDateString();
  setRatesNote(
    (cached ? 'Cached rates' : 'Rates') + ' (ECB via Frankfurter) \u2014 ' + dateStr + '. Base ' + BASE + '.',
    false
  );
  repaintAll(null);
}

function loadCachedRates() {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.rates) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function fetchRates() {
  const symbols = currencyCodes().filter((c) => c !== BASE).join(',');
  const url = 'https://api.frankfurter.dev/v1/latest?base=' + BASE + '&symbols=' + symbols;
  fetch(url)
    .then((res) => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then((data) => {
      const payload = { date: data.date, rates: data.rates, fetchedAt: Date.now() };
      localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(payload));
      applyRates(payload, false);
    })
    .catch(() => {
      const cached = loadCachedRates();
      if (cached) applyRates(cached, true);
      else setRatesNote('Could not load exchange rates. Values shown in their own currency.', true);
    });
}

const cached = loadCachedRates();
if (cached) {
  applyRates(cached, true);
  if (Date.now() - (cached.fetchedAt || 0) > RATES_TTL) fetchRates();
} else {
  fetchRates();
}

