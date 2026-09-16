const $ = (id) => document.getElementById(id);
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format = (value) => value == null ? '—' : String(value).replace('.', ',');
const clock = (seconds) => seconds == null ? '—' : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
// Countdown to a moment: short "42 sec" under a minute, otherwise m:ss.
const countdown = (seconds) => {
  seconds = Math.max(0, seconds);
  return seconds >= 60 ? clock(seconds) : `${Math.ceil(seconds)} sec`;
};
// Recipe step instructions arrive in Russian from the source; translate the
// known brewing verbs, keep anything unexpected as-is.
const INSTRUCTIONS = {'предсмачивание': 'Bloom', 'смачивание': 'Bloom', 'вливание': 'Pour', 'пролив': 'Pour'};
const stepName = (value) => INSTRUCTIONS[String(value ?? '').trim().toLowerCase()] || (value || 'Pour');

let searchRequest, recipeRequest, currentProduct, currentData, currentRecipe;
let timerInterval, running = false, elapsed = 0, startedAt = 0, lastActiveStep = -1;

async function api(path, signal) {
  const response = await fetch(path, {signal});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load data. Please try again.');
  return data;
}

function resetTimer() {
  clearInterval(timerInterval);
  running = false;
  elapsed = 0;
  lastActiveStep = -1;
  updateTimer();
}

async function search(query = '') {
  searchRequest?.abort();
  const request = new AbortController();
  searchRequest = request;
  $('search-button').disabled = true;
  $('catalog-status').className = 'status loading';
  $('catalog-status').textContent = 'Searching the roaster’s catalog…';
  $('results').replaceChildren();
  $('count').textContent = '';
  try {
    const data = await api(`/api/search?q=${encodeURIComponent(query)}`, request.signal);
    $('results-title').textContent = query ? 'Search results' : 'Filter coffees';
    $('count').textContent = `${data.total} / ${data.catalog_size}`;
    $('catalog-status').className = 'status';
    $('catalog-status').textContent = !data.total
      ? 'No coffee found. Try part of the name or check the spelling. Archived lots may be missing.'
      : data.source.stale ? 'The source is temporarily unavailable. Showing a saved catalog.'
      : data.products[0].match === 'similar' ? 'No exact match. You might mean:' : '';
    data.products.forEach((product, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `coffee${currentProduct?.id === product.id ? ' active' : ''}`;
      button.dataset.id = product.id;
      button.setAttribute('aria-pressed', String(currentProduct?.id === product.id));
      button.innerHTML = `<span class="number">${String(i + 1).padStart(2, '0')}</span><span class="coffee-copy"><strong>${escape(product.name)}</strong><small>${escape(product.region || 'Filter roast')}${!product.available ? ' · Out of stock' : ''}</small></span><span class="arrow" aria-hidden="true">↗</span>`;
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
  $('recipe-content').innerHTML = `<div class="empty"><span class="eyebrow">02 / BREW</span><h2>${escape(product.name)}</h2><p class="loading" role="status">Fetching the recipe for this coffee…</p></div>`;
  if (window.matchMedia('(max-width: 620px)').matches) $('recipe-panel').scrollIntoView({behavior:'smooth'});
  try {
    currentData = await api(`/api/recipes/${encodeURIComponent(product.id)}`, request.signal);
    if (!currentData.recipes.length) {
      $('recipe-content').innerHTML = `<div class="empty"><span class="eyebrow">02 / BREW</span><h2>${escape(product.name)}</h2><p>The source has no pour-over<br>recipe for this coffee.</p><a href="${escape(product.url)}" target="_blank" rel="noopener noreferrer">Open the roaster’s page ↗</a></div>`;
    } else renderRecipe(0);
  } catch (error) {
    if (error.name === 'AbortError') return;
    $('recipe-content').innerHTML = `<div class="empty"><h2>Could not<br>load the recipe.</h2><p role="alert">${escape(error.message)}</p><button type="button" class="retry" id="retry">Try again</button><a href="${escape(product.url)}" target="_blank" rel="noopener noreferrer">Coffee page ↗</a></div>`;
    $('retry').addEventListener('click', () => selectProduct(product));
  } finally {
    if (recipeRequest === request) $('recipe-panel').setAttribute('aria-busy', 'false');
  }
}

function renderRecipe(index) {
  resetTimer();
  const recipe = currentRecipe = currentData.recipes[index];
  const metrics = [[recipe.coffee_g,'g','Coffee'],[recipe.water_g,'g','Water'],[recipe.temperature_c,'°C','Temperature'],[clock(recipe.duration_seconds),'','Total time']];
  const variant = currentData.recipes.length > 1 ? `<label class="variant-label" for="recipe-variant">Recipe variant</label><select class="variant-select" id="recipe-variant">${currentData.recipes.map((r, i) => `<option value="${i}" ${i === index ? 'selected' : ''}>${escape(r.device)} · ${format(r.coffee_g)} g · ${escape(r.grinder || 'Grind not specified')} (${i+1})</option>`).join('')}</select>` : '';
  const timestamp = new Date(currentData.source.fetched_at).toLocaleString('en-GB', {dateStyle:'short',timeStyle:'short'});
  const steps = recipe.steps.map((step, i) => {
    const water = step.water_g == null ? '—' : '+' + format(step.water_g) + ' g';
    return `<div class="step" id="step-${i}" data-state="upcoming">
      <span class="step-time">${clock(step.start_seconds)}<small>${clock(step.stop_seconds)}</small></span>
      <div class="step-body"><span class="step-badge" aria-hidden="true"></span><strong>${escape(stepName(step.instruction))}</strong><small class="step-target"></small><span class="step-count"></span></div>
      <span class="step-water">${water}</span>
    </div>`;
  }).join('') || '<p class="status">The source lists no steps.</p>';
  $('recipe-content').innerHTML = `
    <div class="recipe-top"><span class="eyebrow">02 / YOUR RECIPE</span><span class="tag">${escape(recipe.device)}</span></div>
    <h2 class="recipe-title" tabindex="-1">${escape(currentData.product.name)}</h2>
    <p class="recipe-subtitle">Recipe by The Welder Catherine · filter roast</p>
    ${variant}
    ${currentData.stale ? '<p class="warning">The source is temporarily unavailable. Showing saved data; the recipe fetch date is below.</p>' : ''}
    ${recipe.warnings.map(w => `<p class="warning">${escape(w)}</p>`).join('')}
    <div class="specs">${metrics.map(([value,unit,label]) => `<div><span class="spec-value">${escape(format(value))}<small>${unit}</small></span><span class="spec-name">${label}</span></div>`).join('')}</div>
    <div class="detail-line"><span>Coffee-to-water ratio</span><strong>${recipe.ratio ? '1 : '+format(recipe.ratio) : 'Not specified'}</strong></div>
    <div class="detail-line"><span>Grind</span><strong>${escape(recipe.grinder || 'Grinder not specified')}<br>${recipe.grind_setting ? 'Setting '+escape(recipe.grind_setting) : 'Setting not specified'}</strong></div>
    <div class="steps-header"><h3>Pour schedule</h3><span>TIME FROM START</span></div>
    <div class="steps">${steps}</div>
    <div class="timer" id="timer" data-mode="idle">
      <div class="timer-face">
        <span class="timer-phase" id="timer-phase" aria-hidden="true"></span>
        <span id="timer-clock" class="timer-clock" role="timer" aria-label="Elapsed time">0:00</span>
        <span class="timer-action" id="timer-action"></span>
        <span class="timer-remaining" id="timer-remaining"></span>
        <div class="timer-progress" aria-hidden="true"><i id="timer-progress"></i></div>
      </div>
      <div class="timer-controls"><button type="button" id="timer-toggle" ${!recipe.duration_seconds ? 'disabled' : ''}>Start brewing</button><button type="button" id="timer-reset" aria-label="Reset timer">↺</button></div>
    </div>
    <p class="timer-caption" id="timer-caption" role="status">Prepare your coffee and hot water, then start the timer.</p>
    ${recipe.notes ? `<p class="recipe-notes">${escape(recipe.notes)}</p>` : ''}
    <div class="source-links"><a href="${escape(currentData.product.url)}" target="_blank" rel="noopener noreferrer">Coffee page ↗</a><a href="${escape(currentData.source_url)}" target="_blank" rel="noopener noreferrer">Original recipe ↗</a></div>
    <p class="source-time">DATA FETCHED ${escape(timestamp)} · BROWSER TIME ZONE</p>`;
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
    lastActiveStep = -1;
    startedAt = performance.now();
    timerInterval = setInterval(updateTimer, 200);
  }
  updateTimer();
}

function setText(id, value) {
  const node = $(id);
  if (node && node.textContent !== value) node.textContent = value;
}

function flash(node) {
  if (!node) return;
  node.classList.remove('flash');
  void node.offsetWidth; // restart the animation
  node.classList.add('flash');
}

// Give each step one of: completed / active / next / upcoming.
function paintStep(i, step, seconds, activeIndex, nextIndex, started) {
  const row = $('step-' + i);
  if (!row) return;
  let state = 'upcoming';
  if (started) {
    if (seconds >= step.stop_seconds) state = 'completed';
    else if (i === activeIndex) state = 'active';
    else if (i === nextIndex) state = 'next';
  }
  row.dataset.state = state;
  const target = step.total_water_g == null ? '' : format(step.total_water_g) + ' g';
  const badge = row.querySelector('.step-badge');
  const note = row.querySelector('.step-target');
  const count = row.querySelector('.step-count');
  if (state === 'active') {
    badge.textContent = `NOW · ${stepName(step.instruction).toUpperCase()}`;
    note.textContent = target ? `Bring total weight to ${target}` : '';
    count.textContent = `Until ${clock(step.stop_seconds)} · ${Math.max(0, Math.ceil(step.stop_seconds - seconds))} sec remaining`;
  } else if (state === 'next') {
    badge.textContent = `NEXT IN ${countdown(step.start_seconds - seconds).toUpperCase()}`;
    note.textContent = target ? `Target: ${target}` : '';
    count.textContent = '';
  } else {
    badge.textContent = '';
    note.textContent = target ? `Target ${target}` : '';
    count.textContent = '';
  }
}

function updateTimer() {
  if (!$('timer-clock') || !currentRecipe) return;
  const recipe = currentRecipe, steps = recipe.steps, duration = recipe.duration_seconds;
  let seconds = elapsed + (running ? (performance.now() - startedAt) / 1000 : 0);
  const finished = duration && seconds >= duration;
  if (finished) {
    seconds = elapsed = duration;
    running = false;
    clearInterval(timerInterval);
  }
  $('timer-clock').textContent = clock(seconds);

  let activeIndex = -1, nextIndex = -1;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.start_seconds != null && s.stop_seconds != null && seconds >= s.start_seconds && seconds < s.stop_seconds) { activeIndex = i; break; }
  }
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].start_seconds != null && steps[i].start_seconds > seconds) { nextIndex = i; break; }
  }
  const started = running || seconds > 0;
  steps.forEach((step, i) => paintStep(i, step, seconds, activeIndex, nextIndex, started));

  // Briefly highlight a step the moment it becomes active.
  if (running && activeIndex >= 0 && activeIndex !== lastActiveStep) {
    lastActiveStep = activeIndex;
    flash($('step-' + activeIndex));
    flash($('timer-phase'));
  }
  if (activeIndex < 0) lastActiveStep = -1;

  // Timer / current-action panel.
  let mode = 'idle', phase = '', action = '', remaining = '', progress = 0;
  if (finished) {
    mode = 'done'; phase = 'DONE'; action = 'Let the water finish draining. Enjoy your cup.'; progress = 1;
  } else if (!started) {
    mode = 'idle';
  } else if (activeIndex >= 0) {
    const s = steps[activeIndex];
    mode = 'pour';
    phase = stepName(s.instruction).toUpperCase();
    action = s.total_water_g == null ? 'Pour now.' : `Bring total weight to ${format(s.total_water_g)} g`;
    remaining = `${Math.max(0, Math.ceil(s.stop_seconds - seconds))} sec remaining`;
    progress = (seconds - s.start_seconds) / ((s.stop_seconds - s.start_seconds) || 1);
  } else if (nextIndex >= 0) {
    const s = steps[nextIndex], prevStop = nextIndex > 0 ? steps[nextIndex - 1].stop_seconds : 0;
    mode = 'pause';
    phase = 'PAUSE';
    action = `Next pour in ${countdown(s.start_seconds - seconds)}`;
    progress = (seconds - prevStop) / ((s.start_seconds - prevStop) || 1);
  } else {
    const last = steps[steps.length - 1], from = last ? last.stop_seconds : 0;
    mode = 'pause';
    phase = 'DRAWDOWN';
    action = 'Let the water drain.';
    progress = duration ? (seconds - from) / ((duration - from) || 1) : 0;
  }
  $('timer').dataset.mode = mode;
  setText('timer-phase', phase);
  setText('timer-action', action);
  setText('timer-remaining', remaining);
  $('timer-progress').style.width = (Math.max(0, Math.min(1, progress)) * 100).toFixed(1) + '%';

  $('timer-toggle').textContent = finished ? 'Brew again' : running ? 'Pause' : seconds > 0 ? 'Resume' : 'Start brewing';
  const caption = finished ? 'The recipe time is up. Make sure the water has drained. Enjoy!'
    : !started ? 'Prepare your coffee and hot water, then start the timer.'
    : !running ? 'Timer paused.' : '';
  setText('timer-caption', caption);
}

$('search-form').addEventListener('submit', event => {event.preventDefault(); search($('coffee-query').value.trim());});
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
  $('coffee-query').value = button.dataset.query;
  search(button.dataset.query);
}));
search();
