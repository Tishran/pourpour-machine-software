const $ = (id) => document.getElementById(id);
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format = (value) => value == null ? '—' : String(value).replace('.', ',');
const clock = (seconds) => seconds == null ? '—' : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
let searchRequest, recipeRequest, currentProduct, currentData, currentRecipe;
let timerInterval, running = false, elapsed = 0, startedAt = 0;

async function api(path, signal) {
  const response = await fetch(path, {signal});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Не удалось загрузить данные. Попробуйте ещё раз.');
  return data;
}

function resetTimer() {
  clearInterval(timerInterval);
  running = false;
  elapsed = 0;
  updateTimer();
}

async function search(query = '') {
  searchRequest?.abort();
  const request = new AbortController();
  searchRequest = request;
  $('search-button').disabled = true;
  $('catalog-status').className = 'status loading';
  $('catalog-status').textContent = 'Ищем в каталоге обжарщика…';
  $('results').replaceChildren();
  $('count').textContent = '';
  try {
    const data = await api(`/api/search?q=${encodeURIComponent(query)}`, request.signal);
    $('results-title').textContent = query ? 'Результаты поиска' : 'Кофе под фильтр';
    $('count').textContent = `${data.total} / ${data.catalog_size}`;
    $('catalog-status').className = 'status';
    $('catalog-status').textContent = !data.total
      ? 'Кофе не найден. Попробуйте часть названия или проверьте написание. Архивные лоты могут отсутствовать.'
      : data.source.stale ? 'Источник временно недоступен. Показан сохранённый каталог.'
      : data.products[0].match === 'similar' ? 'Точного совпадения нет. Возможно, вы имели в виду:' : '';
    data.products.forEach((product, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `coffee${currentProduct?.id === product.id ? ' active' : ''}`;
      button.dataset.id = product.id;
      button.setAttribute('aria-pressed', String(currentProduct?.id === product.id));
      button.innerHTML = `<span class="number">${String(i + 1).padStart(2, '0')}</span><span class="coffee-copy"><strong>${escape(product.name)}</strong><small>${escape(product.region || 'Обжарка под фильтр')}${!product.available ? ' · Нет в наличии' : ''}</small></span><span class="arrow" aria-hidden="true">↗</span>`;
      button.addEventListener('click', () => selectProduct(product));
      $('results').append(button);
    });
  } catch (error) {
    if (error.name === 'AbortError') return;
    $('catalog-status').className = 'status error';
    $('catalog-status').textContent = error.message;
  } finally {
    if (searchRequest === request) $('search-button').disabled = false;
  }
}

async function selectProduct(product) {
  recipeRequest?.abort();
  const request = new AbortController();
  recipeRequest = request;
  resetTimer();
  currentRecipe = null;
  currentProduct = product;
  document.querySelectorAll('.coffee').forEach(button => {
    const selected = button.dataset.id === product.id;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  $('recipe-empty').hidden = true;
  $('recipe-content').hidden = false;
  $('recipe-panel').setAttribute('aria-busy', 'true');
  $('recipe-content').innerHTML = `<div class="empty"><span class="eyebrow">02 / ЗАВАРИТЬ</span><h2>${escape(product.name)}</h2><p class="loading" role="status">Получаем рецепт для этого кофе…</p></div>`;
  if (window.matchMedia('(max-width: 620px)').matches) $('recipe-panel').scrollIntoView({behavior:'smooth'});
  try {
    currentData = await api(`/api/recipes/${encodeURIComponent(product.id)}`, request.signal);
    if (!currentData.recipes.length) {
      $('recipe-content').innerHTML = `<div class="empty"><span class="eyebrow">02 / ЗАВАРИТЬ</span><h2>${escape(product.name)}</h2><p>Для этого кофе в источнике<br>нет рецепта воронки.</p><a href="${escape(product.url)}" target="_blank" rel="noopener noreferrer">Открыть карточку обжарщика ↗</a></div>`;
    } else renderRecipe(0);
  } catch (error) {
    if (error.name === 'AbortError') return;
    $('recipe-content').innerHTML = `<div class="empty"><h2>Не удалось<br>получить рецепт.</h2><p role="alert">${escape(error.message)}</p><button type="button" class="retry" id="retry">Попробовать снова</button><a href="${escape(product.url)}" target="_blank" rel="noopener noreferrer">Карточка кофе ↗</a></div>`;
    $('retry').addEventListener('click', () => selectProduct(product));
  } finally {
    if (recipeRequest === request) $('recipe-panel').setAttribute('aria-busy', 'false');
  }
}

function renderRecipe(index) {
  resetTimer();
  const recipe = currentRecipe = currentData.recipes[index];
  const metrics = [[recipe.coffee_g,'г','Кофе'],[recipe.water_g,'г','Вода'],[recipe.temperature_c,'°C','Температура'],[clock(recipe.duration_seconds),'','Общее время']];
  const variant = currentData.recipes.length > 1 ? `<label class="variant-label" for="recipe-variant">Вариант рецепта</label><select class="variant-select" id="recipe-variant">${currentData.recipes.map((r, i) => `<option value="${i}" ${i === index ? 'selected' : ''}>${escape(r.device)} · ${format(r.coffee_g)} г · ${escape(r.grinder || 'Помол не указан')} (${i+1})</option>`).join('')}</select>` : '';
  const timestamp = new Date(currentData.source.fetched_at).toLocaleString('ru-RU', {dateStyle:'short',timeStyle:'short'});
  $('recipe-content').innerHTML = `
    <div class="recipe-top"><span class="eyebrow">02 / ВАШ РЕЦЕПТ</span><span class="tag">${escape(recipe.device)}</span></div>
    <h2 class="recipe-title" tabindex="-1">${escape(currentData.product.name)}</h2>
    <p class="recipe-subtitle">Рецепт от The Welder Catherine · обжарка под фильтр</p>
    ${variant}
    ${currentData.stale ? '<p class="warning">Источник временно недоступен. Используются сохранённые данные; дата загрузки рецепта указана ниже.</p>' : ''}
    ${recipe.warnings.map(w => `<p class="warning">${escape(w)}</p>`).join('')}
    <div class="specs">${metrics.map(([value,unit,label]) => `<div><span class="spec-value">${escape(format(value))}<small>${unit}</small></span><span class="spec-name">${label}</span></div>`).join('')}</div>
    <div class="detail-line"><span>Соотношение кофе и воды</span><strong>${recipe.ratio ? '1 : '+format(recipe.ratio) : 'Не указано'}</strong></div>
    <div class="detail-line"><span>Помол</span><strong>${escape(recipe.grinder || 'Кофемолка не указана')}<br>${recipe.grind_setting ? 'Настройка '+escape(recipe.grind_setting) : 'Настройка не указана'}</strong></div>
    <div class="steps-header"><h3>План вливаний</h3><span>ВРЕМЯ ОТ СТАРТА</span></div>
    <div class="steps">${recipe.steps.map((step, i) => `<div class="step" id="step-${i}"><span class="step-time">${clock(step.start_seconds)}<small>до ${clock(step.stop_seconds)}</small></span><div><strong>${escape(step.instruction || 'Вливание')}</strong><small>${step.total_water_g == null ? 'Объём на весах не указан' : 'На весах '+format(step.total_water_g)+' г'}${step.temperature_c ? ' · '+format(step.temperature_c)+' °C' : ''}</small></div><span class="step-water">${step.water_g == null ? '—' : '+'+format(step.water_g)+' г'}</span></div>`).join('') || '<p class="status">Шаги в источнике не указаны.</p>'}</div>
    <div class="timer"><span id="timer-clock" class="timer-clock" role="timer" aria-label="Прошло времени">0:00</span><div class="timer-controls"><button type="button" id="timer-toggle" ${!recipe.duration_seconds ? 'disabled' : ''}>Начать заваривание</button><button type="button" id="timer-reset" aria-label="Сбросить таймер">↺</button></div></div>
    <p class="timer-caption" id="timer-caption" role="status">Подготовьте кофе и горячую воду, затем запустите таймер.</p>
    ${recipe.notes ? `<p class="recipe-notes">${escape(recipe.notes)}</p>` : ''}
    <div class="source-links"><a href="${escape(currentData.product.url)}" target="_blank" rel="noopener noreferrer">Карточка кофе ↗</a><a href="${escape(currentData.source_url)}" target="_blank" rel="noopener noreferrer">Исходный рецепт ↗</a></div>
    <p class="source-time">ДАННЫЕ ЗАГРУЖЕНЫ ${escape(timestamp)} · ЧАСОВОЙ ПОЯС БРАУЗЕРА</p>`;
  $('recipe-variant')?.addEventListener('change', event => renderRecipe(Number(event.target.value)));
  $('timer-toggle').addEventListener('click', toggleTimer);
  $('timer-reset').addEventListener('click', resetTimer);
  document.querySelector('.recipe-title').focus({preventScroll:true});
}

function toggleTimer() {
  if (!currentRecipe?.duration_seconds) return;
  if (running) {
    elapsed += (performance.now() - startedAt) / 1000;
    running = false;
    clearInterval(timerInterval);
  } else {
    if (elapsed >= currentRecipe.duration_seconds) elapsed = 0;
    running = true;
    startedAt = performance.now();
    timerInterval = setInterval(updateTimer, 200);
  }
  updateTimer();
}

function updateTimer() {
  if (!$('timer-clock') || !currentRecipe) return;
  let seconds = elapsed + (running ? (performance.now() - startedAt) / 1000 : 0);
  const finished = currentRecipe.duration_seconds && seconds >= currentRecipe.duration_seconds;
  if (finished) {
    seconds = elapsed = currentRecipe.duration_seconds;
    running = false;
    clearInterval(timerInterval);
  }
  $('timer-clock').textContent = clock(seconds);
  $('timer-toggle').textContent = finished ? 'Заварить ещё раз' : running ? 'Пауза' : seconds > 0 ? 'Продолжить' : 'Начать заваривание';
  const step = currentRecipe.steps.findIndex(s => s.start_seconds != null && s.stop_seconds != null && seconds >= s.start_seconds && seconds < s.stop_seconds);
  currentRecipe.steps.forEach((_, i) => $('step-'+i)?.classList.toggle('active', running && i === step));
  const caption = finished ? 'Время рецепта истекло. Проверьте, что вода стекла. Приятного кофе!'
    : !running ? seconds > 0 ? 'Таймер на паузе.' : 'Подготовьте кофе и горячую воду, затем запустите таймер.'
    : step >= 0 ? `${currentRecipe.steps[step].instruction || 'Вливание'} · ${currentRecipe.steps[step].water_g == null ? 'объём не указан' : format(currentRecipe.steps[step].water_g)+' г воды'}`
    : 'Дайте воде стечь. Следите за временем следующего вливания.';
  if ($('timer-caption').textContent !== caption) $('timer-caption').textContent = caption;
}

$('search-form').addEventListener('submit', event => {event.preventDefault(); search($('coffee-query').value.trim());});
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
  $('coffee-query').value = button.dataset.query;
  search(button.dataset.query);
}));
search();
