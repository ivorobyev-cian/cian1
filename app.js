'use strict';

const $ = (selector) => document.querySelector(selector);
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const storageKey = 'cian-home-prototype-v1';
const modes = {
  buy: { title: 'Купить квартиру', label: 'Купить', hint: 'Стоимость объекта' },
  rent: { title: 'Снять квартиру', label: 'Снять', hint: 'Аренда в месяц' },
  newbuild: { title: 'Квартира в новостройке', label: 'Новостройки', hint: 'Стоимость объекта' },
  daily: { title: 'Снять посуточно', label: 'Посуточно', hint: 'Стоимость за ночь' },
  commercial: { title: 'Коммерческая недвижимость', label: 'Коммерческая', hint: 'Стоимость объекта' },
};
const sampleQuery = { vertical: 'buy', location: 'Ясенево', rooms: ['2'], budget: '18000000', checkin: '', checkout: '', guests: '2', property: 'office', area: '' };
const properties = { office: 'Офис', retail: 'Торговая площадь', warehouse: 'Склад', free: 'Свободное назначение' };
const baseListings = [
  { id: 'a1', image: 'living-room.jpg', tag: 'Проверено Цианом', amount: 17800000, price: '17 800 000 ₽', rate: '329 630 ₽/м²', rooms: '2', details: '2-комн. квартира · 54 м² · 9/17 этаж', address: 'Москва, Литовский бульвар, 6к1', metro: 'Ясенево', walk: '8 мин. пешком', capacity: 3 },
  { id: 'a2', image: 'apartment.jpg', tag: 'Хорошая цена', amount: 19200000, price: '19 200 000 ₽', rate: '314 754 ₽/м²', rooms: '2', details: '2-комн. квартира · 61 м² · 15/22 этаж', address: 'Москва, ул. Тёплый Стан, 12', metro: 'Тёплый Стан', walk: '11 мин. пешком', capacity: 5 },
  { id: 'a3', image: 'apartment.jpg', tag: 'От собственника', amount: 13900000, price: '13 900 000 ₽', rate: '397 143 ₽/м²', rooms: '1', details: '1-комн. квартира · 35 м² · 4/12 этаж', address: 'Москва, ул. Профсоюзная, 104', metro: 'Коньково', walk: '6 мин. пешком', capacity: 2 },
];
const overrides = {
  rent: [
    { amount: 75000, price: '75 000 ₽/мес.', rate: 'Без комиссии' },
    { amount: 92000, price: '92 000 ₽/мес.', rate: 'Залог 1 месяц' },
    { amount: 58000, price: '58 000 ₽/мес.', rate: 'Без комиссии' },
  ],
  daily: [
    { amount: 5200, price: '5 200 ₽/ночь', rate: 'До 3 гостей', tag: 'Можно с детьми' },
    { amount: 6400, price: '6 400 ₽/ночь', rate: 'До 5 гостей', tag: 'От 1 ночи' },
    { amount: 3900, price: '3 900 ₽/ночь', rate: 'До 2 гостей', tag: 'Самостоятельный заезд' },
  ],
  newbuild: [
    { amount: 16400000, price: '16 400 000 ₽', rate: 'От застройщика', details: '2-комн. квартира · 52 м² · 12/25 этаж', tag: 'Новостройка' },
    { amount: 18900000, price: '18 900 000 ₽', rate: 'От застройщика', tag: 'Сдача в 2027' },
    { amount: 12100000, price: '12 100 000 ₽', rate: 'От застройщика', tag: 'С отделкой' },
  ],
  commercial: [
    { amount: 21800000, price: '21 800 000 ₽', rate: '181 667 ₽/м²', details: 'Офис · 120 м² · 2/8 этаж', tag: 'Готов к въезду', property: 'office', area: 120, image: 'building.jpg' },
    { amount: 29400000, price: '29 400 000 ₽', rate: '210 000 ₽/м²', details: 'Торговая площадь · 140 м² · 1 этаж', tag: 'От собственника', property: 'retail', area: 140, image: 'building.jpg' },
    { amount: 18900000, price: '18 900 000 ₽', rate: '63 000 ₽/м²', details: 'Склад · 300 м² · 1 этаж', tag: 'От собственника', property: 'warehouse', area: 300, image: 'building.jpg' },
  ],
};
const allListingIds = new Set(Object.keys(modes).flatMap((vertical) => baseListings.map((listing) => `${vertical}-${listing.id}`)));
const emptyQuery = (vertical = 'buy') => ({ ...sampleQuery, vertical, location: '', rooms: [], budget: '' });
const normalize = (value) => value.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
function validQuery(query) {
  return query && modes[query.vertical] && typeof query.location === 'string' && query.location.length <= 60 && Array.isArray(query.rooms) && query.rooms.every((room) => ['studio', '1', '2', '3', '4+'].includes(room)) && ['budget','checkin','checkout','guests','property','area'].every((key) => typeof query[key] === 'string');
}
let stored = {};
try { stored = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { /* Storage is optional in file previews. */ }
let favorites = new Set(Array.isArray(stored.favorites) ? stored.favorites.filter((id) => allListingIds.has(id)) : []);
let savedQuery = validQuery(stored.savedQuery) ? stored.savedQuery : null;
let currentQuery = validQuery(stored.currentQuery) ? stored.currentQuery : null;
let draftRooms = [];
let lastTrigger = null;

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ favorites: [...favorites], savedQuery, currentQuery })); } catch { /* The prototype also works without storage. */ }
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}
function querySummary(query) {
  const parts = [];
  if (query.vertical === 'daily') parts.push('Посуточно');
  else if (query.vertical === 'commercial') parts.push(properties[query.property] || 'Коммерческая');
  else parts.push(query.rooms.length ? query.rooms.map((room) => room === 'studio' ? 'Студия' : `${room}-комн.`).join(', ') : modes[query.vertical].label);
  parts.push(query.location || 'Москва');
  if (query.budget) {
    const amount = Number(query.budget);
    parts.push(`до ${amount >= 1000000 ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(amount / 1000000) + ' млн' : new Intl.NumberFormat('ru-RU').format(amount)} ₽${query.vertical === 'daily' ? '/ночь' : query.vertical === 'rent' ? '/мес.' : ''}`);
  }
  if (query.vertical === 'commercial' && query.area) parts.push(`от ${query.area} м²`);
  if (query.vertical === 'daily' && query.checkin && query.checkout) {
    const format = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    parts.push(`${format(query.checkin)} — ${format(query.checkout)}`, `${query.guests} гост.`);
  }
  return parts.join(' · ');
}
function fixtures(vertical = 'buy') {
  return baseListings.map((listing, index) => ({ ...listing, ...(overrides[vertical]?.[index] || {}), id: `${vertical}-${listing.id}`, vertical }));
}
function activeListings() {
  const query = currentQuery;
  return fixtures(query?.vertical).filter((listing) => !query || (
    (!query.budget || listing.amount <= Number(query.budget)) &&
    (!query.location || normalize(`${listing.address} ${listing.metro}`).includes(normalize(query.location))) &&
    (['daily','commercial'].includes(query.vertical) || !query.rooms.length || query.rooms.includes(listing.rooms)) &&
    (query.vertical !== 'daily' || listing.capacity >= Number(query.guests)) &&
    (query.vertical !== 'commercial' || (listing.property === query.property && (!query.area || listing.area >= Number(query.area))))
  ));
}
function listingById(id) {
  return Object.keys(modes).flatMap((vertical) => fixtures(vertical)).find((listing) => listing.id === id);
}
function listingHTML(listing) {
  const selected = favorites.has(listing.id);
  return `<article class="listing"><button class="listing-link" type="button" data-listing="${listing.id}" aria-label="${escapeHTML(listing.details)}, ${escapeHTML(listing.price)}"><div class="listing-photo"><img src="assets/${listing.image}" alt="${escapeHTML(listing.details)}" width="800" height="520"><span class="photo-tag">${listing.tag}</span><span class="photo-pages" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div><div class="listing-copy"><span class="listing-price-row"><strong class="listing-price">${listing.price}</strong><span class="listing-rate">${listing.rate}</span></span><span class="listing-details">${listing.details}</span><span class="listing-address">${listing.address}</span><span class="listing-metro"><span class="metro-mark" aria-hidden="true">М</span>${listing.metro}<span class="metro-walk">· ${listing.walk}</span></span></div></button><button class="favorite-button" type="button" data-favorite="${listing.id}" aria-label="${selected ? 'Удалить из избранного' : 'В избранное'}: ${escapeHTML(listing.details)}" aria-pressed="${selected}">${icon('heart')}</button></article>`;
}
function render() {
  const userState = savedQuery ? 'returning' : 'new';
  $('#app').dataset.user = userState;
  $('#saved-section').hidden = userState !== 'returning';
  $('#saved-summary').textContent = querySummary(savedQuery || sampleQuery);
  $('.new-count').textContent = savedQuery ? 'Сохранён' : '14 новых';
  $('#search-summary').textContent = currentQuery ? querySummary(currentQuery) : 'Где хотите жить?';
  $('#recommendations-title').textContent = currentQuery ? 'По вашему запросу' : userState === 'returning' ? 'Вам могут подойти' : 'Предложения в Москве';
  $('#recommendations-caption').textContent = currentQuery ? querySummary(currentQuery) : userState === 'returning' ? 'На основе сохранённого поиска' : 'Покупка недвижимости';
  document.querySelectorAll('[data-vertical]').forEach((button) => button.dataset.active = String(currentQuery?.vertical === button.dataset.vertical));
  const data = activeListings();
  $('#results-count').textContent = data.length;
  $('#listings').innerHTML = data.length ? data.slice(0, 2).map(listingHTML).join('') : '<div class="empty-results"><strong>Попробуем немного шире?</strong><p>Среди тестовых объявлений нет подходящих. Измените район или увеличьте бюджет.</p><button type="button" class="primary-button" data-action="search">Изменить параметры</button></div>';
  $('#more-listings').innerHTML = data.slice(2).map(listingHTML).join('');
  $('.more-section').hidden = data.length <= 2;
  updateFavoriteButtons();
}
function updateFavoriteButtons() {
  document.querySelectorAll('[data-favorite]').forEach((button) => {
    const selected = favorites.has(button.dataset.favorite);
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${selected ? 'Удалить из избранного' : 'В избранное'}: ${listingById(button.dataset.favorite).details}`);
  });
  $('#favorites-count').textContent = favorites.size;
  $('#favorites-count').hidden = !favorites.size;
}
function notify(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => $('#toast').classList.remove('visible'), 2400);
}
function showDialog(dialog, trigger) {
  if (!dialog.open) {
    lastTrigger = trigger || document.activeElement;
    dialog.showModal();
  }
  document.body.classList.add('modal-open');
}
function updateSearchFields() {
  const vertical = $('#vertical-select').value;
  $('#search-title').textContent = modes[vertical].title;
  $('#room-fields').hidden = ['daily', 'commercial'].includes(vertical);
  $('#daily-fields').hidden = vertical !== 'daily';
  $('#commercial-fields').hidden = vertical !== 'commercial';
  $('#budget-hint').textContent = modes[vertical].hint;
  $('#search-error').hidden = true;
  for (const field of $('#daily-fields').querySelectorAll('input,select')) field.disabled = vertical !== 'daily';
  for (const field of $('#commercial-fields').querySelectorAll('input,select')) field.disabled = vertical !== 'commercial';
  $('#checkin-input').required = vertical === 'daily';
  $('#checkout-input').required = vertical === 'daily';
}
function openSearch(trigger, query) {
  const draft = query || currentQuery || emptyQuery();
  $('#search-form').reset();
  $('#vertical-select').value = draft.vertical;
  $('#location-input').value = draft.location;
  $('#budget-input').value = draft.budget;
  $('#checkin-input').value = draft.checkin;
  $('#checkout-input').value = draft.checkout;
  $('#guests-input').value = draft.guests;
  $('#property-input').value = draft.property;
  $('#area-input').value = draft.area;
  $('#save-input').checked = Boolean(savedQuery && JSON.stringify(draft) === JSON.stringify(savedQuery));
  draftRooms = [...draft.rooms];
  document.querySelectorAll('[data-room]').forEach((button) => button.setAttribute('aria-pressed', String(draftRooms.includes(button.dataset.room))));
  updateSearchFields();
  showDialog($('#search-dialog'), trigger);
  $('#search-dialog .close-button').focus({ preventScroll: true });
}
function showInfo(title, content, trigger) {
  $('#info-title').textContent = title;
  $('#info-content').innerHTML = content;
  showDialog($('#info-dialog'), trigger);
  $('#info-dialog .close-button').focus({ preventScroll: true });
}
function outsideScope(title, trigger) {
  showInfo(title, '<p class="info-text">Этот экран за пределами прототипа главной. Здесь можно проверить поиск, сохранённые запросы и добавление в избранное.</p><button class="primary-button" type="button" data-close>Вернуться на главную</button>', trigger);
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.vertical) {
    openSearch(button, currentQuery?.vertical === button.dataset.vertical ? currentQuery : emptyQuery(button.dataset.vertical));
  } else if (button.dataset.room) {
    const room = button.dataset.room;
    draftRooms = draftRooms.includes(room) ? draftRooms.filter((item) => item !== room) : [...draftRooms, room];
    button.setAttribute('aria-pressed', String(draftRooms.includes(room)));
  } else if (button.dataset.favorite) {
    const id = button.dataset.favorite;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    updateFavoriteButtons(); persist();
    if ($('#info-dialog').open && $('#info-title').textContent === 'Избранное') {
      button.closest('.listing')?.remove();
      if (!favorites.size) $('#info-content').innerHTML = '<p class="info-text">Пока ничего нет. Нажмите на сердечко у понравившегося объекта — он появится здесь.</p>';
      $('#info-dialog .close-button').focus({ preventScroll: true });
    }
    notify(favorites.has(id) ? 'Добавлено в избранное' : 'Удалено из избранного');
  } else if (button.hasAttribute('data-close')) {
    button.closest('dialog').close();
  } else if (button.dataset.listing) {
    outsideScope('Карточка объявления', button);
  } else if (button.id === 'saved-search') {
    openSearch(button, savedQuery || sampleQuery);
  } else if (button.dataset.action === 'search') {
    openSearch(button);
  } else if (button.dataset.action === 'advert') {
    showInfo('ЖК «Речной парк»', '<img class="project-image" src="assets/building.jpg" alt="Современные жилые башни"><p class="eyebrow">Реклама · пример проекта</p><p class="project-price">от 12,4 млн ₽</p><p class="info-text">Квартиры в Москве. Архитектура, благоустроенный двор и прогулочные пространства.</p><div class="project-facts"><span>От застройщика</span><span>Квартиры с отделкой</span></div><button class="primary-button" type="button" data-close>Вернуться на главную</button>', button);
  } else if (button.dataset.action === 'collection') {
    outsideScope('Дома за городом', button);
  } else if (button.dataset.nav === 'home') {
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  } else if (button.dataset.nav === 'favorites') {
    const data = [...favorites].map(listingById).filter(Boolean);
    showInfo('Избранное', data.length ? `<div class="listings">${data.map(listingHTML).join('')}</div>` : '<p class="info-text">Пока ничего нет. Нажмите на сердечко у понравившегося объекта — он появится здесь.</p>', button);
  } else if (button.dataset.nav) {
    outsideScope(button.dataset.nav === 'messages' ? 'Сообщения' : 'Профиль', button);
  }
});

$('#vertical-select').addEventListener('change', updateSearchFields);
$('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const vertical = form.get('vertical');
  if (vertical === 'daily' && form.get('checkout') <= form.get('checkin')) {
    $('#search-error').textContent = 'Дата выезда должна быть позже даты заезда.';
    $('#search-error').hidden = false;
    $('#checkout-input').focus();
    return;
  }
  currentQuery = { vertical, location: form.get('location').trim(), rooms: ['daily','commercial'].includes(vertical) ? [] : [...draftRooms], budget: form.get('budget'), checkin: form.get('checkin') || '', checkout: form.get('checkout') || '', guests: form.get('guests') || '2', property: form.get('property') || 'office', area: form.get('area') || '' };
  const shouldSave = form.get('save') === 'on';
  if (shouldSave) savedQuery = structuredClone(currentQuery);
  $('#search-dialog').close();
  render(); persist();
  notify(shouldSave ? 'Поиск сохранён. Продолжайте с главной' : 'Подборка обновлена · тестовые предложения');
});

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    const trigger = lastTrigger?.isConnected ? lastTrigger : (lastTrigger?.id ? document.getElementById(lastTrigger.id) : null);
    trigger?.focus({ preventScroll: true });
  });
}
const today = new Date();
const dateString = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
$('#checkin-input').min = dateString(today);
$('#checkout-input').min = dateString(new Date(today.getFullYear(), today.getMonth(), today.getDate()+1));
render();
