const $ = (id) => document.getElementById(id);
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format = (value) => value == null ? '—' : String(value).replace('.', ',');
const clock = (seconds) => seconds == null ? '—' : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
let searchRequest, recipeRequest, currentProduct, currentData, currentRecipe;
let timerInterval, running = false, elapsed = 0, startedAt = 0;
let photoRequest, photoGeneration = 0;

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
  cancelPhotoRequests();
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
    <p class="recipe-subtitle">${escape(currentData.recipe_subtitle || 'Рецепт от The Welder Catherine · обжарка под фильтр')}</p>
    ${currentData.recommendation_kind === 'suggested_reference' ? '<p class="warning">Предложение для первого заваривания. Этот рецепт проверен обжарщиком на другом кофе. Вкус на вашем кофе ещё не оценён.</p>' : ''}
    ${currentData.recommendation_kind === 'catalog_match' ? '<p class="recipe-notes">Сверьте обжарщика, урожай и обжарку под фильтр с пачкой: название может повторяться у разных лотов.</p>' : ''}
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
    <div class="source-links"><a href="${escape(currentData.product.url)}" target="_blank" rel="noopener noreferrer">${currentData.recommendation_kind === 'suggested_reference' ? 'Кофе-основа' : 'Карточка кофе'} ↗</a><a href="${escape(currentData.source_url)}" target="_blank" rel="noopener noreferrer">Исходный рецепт ↗</a></div>
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

function cancelPhotoRequests() {
  photoGeneration++;
  photoRequest?.abort();
  photoRequest = null;
  $('prepare-recipe').disabled = false;
}

function startPhotoRequest(message) {
  cancelPhotoRequests();
  recipeRequest?.abort();
  resetTimer();
  currentRecipe = currentData = currentProduct = null;
  document.querySelectorAll('.coffee.active').forEach(button => {
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
  });
  $('recipe-content').hidden = true;
  $('recipe-empty').hidden = false;
  $('recipe-panel').setAttribute('aria-busy', 'false');
  $('label-candidates').replaceChildren();
  $('photo-status').className = 'status loading';
  $('photo-status').textContent = message;
  $('prepare-recipe').disabled = true;
  photoRequest = new AbortController();
  return {generation: photoGeneration, controller: photoRequest};
}

async function post(path, body, type, signal) {
  const response = await fetch(path, {method:'POST', headers:{'Content-Type':type}, body, signal});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Не удалось обработать этикетку.');
  return data;
}

function showRecommendation(data) {
  $('photo-status').className = 'status';
  $('photo-status').textContent = data.message;
  $('label-candidates').replaceChildren();
  if (data.kind === 'confirm_match') {
    data.candidates.forEach(candidate => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `Да, ${candidate.name} от The Welder Catherine, под фильтр`;
      button.addEventListener('click', () => prepareRecipe(candidate.coffee_id));
      $('label-candidates').append(button);
    });
  }
  if (data.recipe_data) {
    currentData = data.recipe_data;
    currentProduct = currentData.product;
    $('recipe-empty').hidden = true;
    $('recipe-content').hidden = false;
    renderRecipe(0);
    if (window.matchMedia('(max-width: 620px)').matches) $('recipe-panel').scrollIntoView({behavior:'smooth'});
  }
}

async function prepareRecipe(selected) {
  const request = startPhotoRequest('Подбираем рецепт по этикетке…');
  try {
    const data = await post('/api/recommend', JSON.stringify({text:$('label-text').value, selected_coffee_id:selected || null}), 'application/json', request.controller.signal);
    if (request.generation !== photoGeneration) return;
    showRecommendation(data);
  } catch (error) {
    if (error.name !== 'AbortError' && request.generation === photoGeneration) {
      $('photo-status').className = 'status error';
      $('photo-status').textContent = error.message;
    }
  } finally {
    if (request.generation === photoGeneration) $('prepare-recipe').disabled = false;
  }
}

async function photoBlob(file) {
  if (file.size > 8000000) throw new Error('Выберите фото меньше 8 МБ.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Нужен файл JPEG, PNG или WebP.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  $('label-preview').src = canvas.toDataURL('image/jpeg', .92);
  $('label-preview').hidden = false;
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .92));
  if (!blob) throw new Error('Не удалось открыть фото. Попробуйте пересохранить его как JPEG.');
  return blob;
}

$('label-photo').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  const request = startPhotoRequest('Читаем этикетку на фото…');
  $('label-text').value = '';
  $('label-preview').hidden = true;
  try {
    const body = await photoBlob(file);
    if (request.generation !== photoGeneration) return;
    const data = await post('/api/label', body, 'image/jpeg', request.controller.signal);
    if (request.generation !== photoGeneration) return;
    $('label-text').value = data.ocr.text;
    $('label-editor').open = true;
    showRecommendation(data.recommendation);
  } catch (error) {
    if (error.name !== 'AbortError' && request.generation === photoGeneration) {
      $('photo-status').className = 'status error';
      $('photo-status').textContent = error.message;
      $('label-editor').open = true;
    }
  } finally {
    if (request.generation === photoGeneration) $('prepare-recipe').disabled = false;
    event.target.value = '';
  }
});
$('prepare-recipe').addEventListener('click', () => prepareRecipe());
api('/api/model').then(data => {
  if (photoGeneration) return;
  $('photo-status').textContent = data.ocr.available ? `${data.coffees} кофе в сохранённой базе · русский и английский` : data.ocr.message;
}).catch(() => {
  if (!photoGeneration) $('photo-status').textContent = 'Модель недоступна. Проверьте установку сервера.';
});
search();
