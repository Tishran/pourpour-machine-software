# First Brew Membership

Статус: **фаза 0 — аудит и карта функций**. Этот документ описывает текущее
приложение до внедрения тарифов и прав доступа. На этой фазе код приложения не
меняется.

## Продуктовая модель

First Brew — один сервис с двумя основными сценариями:

- **Научиться**: приложение объясняет, помогает сварить вручную, разобрать вкус и
  улучшить рецепт.
- **Не париться**: приложение подбирает рецепт, а машина First Brew выполняет
  вливания.

Короткая формула продукта: **приложение — мозг, машина — руки**. Один и тот же
совместимый рецепт можно пройти вручную по таймеру или передать машине.

Правила будущего разграничения доступа:

1. Рецепт обжарщика, его поиск, распознавание пачки и ручной таймер бесплатны.
2. Машина не блокируется из-за подписки. Владелец машины может передать ей рецепт
   обжарщика или любой уже сохранённый совместимый рецепт и на плане `free`.
3. Первая автоматическая правка рецепта бесплатна, следующие требуют membership.
4. Бесплатно можно хранить до трёх своих рецептов; ранее сохранённые записи не
   удаляются и остаются пригодны для заваривания.
5. Платёжной интеграции в демо нет.

## Существующие экраны

Верхнеуровневая навигация задаётся `data-screen` на `<body>` и массивом `SCREENS`
в `webapp/static/app.js`.

| Экран | Назначение | Основные состояния |
| --- | --- | --- |
| `find` | Главный экран, фото пачки, поиск, недавние заваривания, вход в конструктор и «Мои рецепты», опрос предзаказа | пустой, загрузка/ошибка каталога, результаты поиска, сканирование фото |
| `confirm` | Проверка распознанных с пачки признаков до показа рецепта | точное/неуверенное распознавание, нечитаемое фото, выбор кофе из каталога |
| `recipe` | Исходный рецепт обжарщика или похожий рецепт-ориентир | варианты рецепта, ручная правка, подтверждённые признаки фото, отправка на машину |
| `construct` | Мастер расчётного рецепта | 1: кофе; 2: оборудование; 3: два стартовых варианта; 4: оценка результата; 5: диагноз и правка |
| `brew` | Ручной таймер или телеметрия машины | готовность, вливание/ожидание/слив, пауза, завершение, ошибка/нет связи машины |
| `mine` | Список сохранённых на устройстве рецептов | список или пустое состояние |
| `own` | Карточка сохранённого либо полученного по ссылке рецепта | переименование, повтор, оценка, экспорт, удаление, отправка на машину |

Отдельного экрана настроек пока нет. Язык переключается на `find` и `construct`,
звук и вибрация — на `brew`. Эти настройки хранятся в
`firstbrew.settings.v1`.

## Карта функций и предлагаемое распределение

В столбце «Уровень»:

- `free` — доступно всем, иногда с явно указанным лимитом;
- `member` — требует активной месячной/годовой подписки;
- `machine` — требует физически подключённую машину и право владельца, но **не**
  активную подписку;
- `free → member` — первая операция или ограниченный объём бесплатны, затем
  membership.

| Функция | Экран | Клиентские функции в `app.js` | API / хранение | Уровень |
| --- | --- | --- | --- | --- |
| Поиск кофе по названию, части и транслитерации; похожие совпадения | `find` | `search`, `selectProduct`, `markSelected` | `GET /api/search`, затем `GET /api/recipes/{id}` | `free` |
| Показ всего каталога и статуса сохранённого кэша | `find` | `search` | `GET /api/search?q=` | `free` |
| Фото пачки с камеры или из галереи, локальная подготовка JPEG | `find` | `handlePhoto`, `photoBlob`, `showPhotoPreview`, `cancelPhotoRequests` | `POST /api/label` (`/api/scan` — совместимый серверный alias); фото не хранится | `free` |
| OCR и подбор точного либо похожего кофе | `find`, `confirm` | `handlePhoto`, `showRecommendation` | `GET /api/model`, `POST /api/label`, `POST /api/recommend` | `free` |
| Подтверждение/исправление страны, обработки, разновидности и названия | `confirm` | `renderConfirmation`, `renderNameCandidates`, `searchConfirmationNames`, `confirmRecipe`, `confirmedText` | `GET /api/search`, `POST /api/recommend`; только память вкладки | `free` |
| Ручной путь при нечитаемом фото или кофе вне каталога | `confirm`, `construct` | `searchInstead`, `openPrefilledBuilder`, `updateConfirmActions` | `POST /api/recommend`, `GET /api/catalog/options` | `free` |
| Рецепт обжарщика без изменений | `recipe` | `selectProduct`, `renderRecipe` | `GET /api/recipes/{id}` | `free` всегда |
| Переключение нескольких вариантов рецепта обжарщика | `recipe` | `renderRecipe` | данные из `GET /api/recipes/{id}` | `free` |
| Похожий рецепт-ориентир для неизвестного кофе с честной пометкой | `recipe` | `showRecommendation`, `renderRecipe` | `POST /api/recommend` | `free` |
| Ручная правка исходного рецепта перед одной заваркой | `recipe` | `openRecipeEditor`, `renderRecipe` | только память вкладки | `free` |
| Показ параметров, помола, соотношения, шагов, оговорок и ссылки на источник | `recipe` | `renderRecipe`, `stepName`, `sourceWarning`, `sourceNote` | данные `GET /api/recipes/{id}` | `free` |
| Недавние рецепты обжарщика на устройстве | `find` | `loadRecents`, `saveRecent`, `renderRecents`, `selectRecent` | `firstbrew.recentRecipes.v1`, максимум 8 | `free`; позднее это не заменяет дневник |
| Вход в расчётный конструктор и базовые поля кофе/оборудования | `construct` | `beginBuilder`, `renderBuilderFields`, `builderParams`, `wireCombos` | `GET /api/catalog/options` | `free` |
| Заполнение конструктора из фото и профиля кофе каталога | `construct` | `builderPhoto`, `openPrefilledBuilder`, `openCatalogRecommendation` | `POST /api/label`, `GET /api/coffee/profile`, `GET /api/catalog/options` | `free` |
| Один стартовый расчётный рецепт | `construct`, шаг 3 | `buildBuilderRecipes`, `renderBuilderResult` | `POST /api/recipes/build` | `free`; клиент должен показывать один вариант |
| Второй расчётный вариант «Ярче/Слаще» | `construct`, шаг 3 | `renderBuilderResult` и переключатели варианта | `POST /api/recipes/build` возвращает оба варианта | `member` |
| Pro-режим: шкала обжарки 1–7, регион, сорт, Q grade, pH и TDS воды, фильтр | `construct`, шаги 1–2 | `renderBuilderFields`, переключатель `builder-mode`, `builderParams` | `GET /api/catalog/options`, `POST /api/recipes/build` | `member` |
| Объяснения причин параметров и предупреждения о точности | `construct`, шаги 3 и 5; `own` | `calculatedReasons`, `calculatedOrigin`, `grindInfo` | поля ответа движка | `free` для доступного рецепта |
| Пересчёт дозы/воды стартового или исправленного рецепта | `construct`, шаги 3 и 5 | `adjustBuilderQuantity`, `adjustCorrectionQuantity`, `calculatedTiles` | `POST /api/recipes/rescale` | `member` |
| Локальный таймер рецепта обжарщика | `brew` | `toggleTimer`, `updateTimer`, `resetTimer` | без API | `free` |
| Локальный таймер расчётного/сохранённого рецепта: готовность, вливания, ожидания, слив, навигация по шагам | `brew` | `calculatedTimeline`, `renderCalculatedTimer`, `jumpCalculatedStep`, `updateTimer` | без API | `free` для доступного или уже сохранённого рецепта |
| Звук, вибрация и Wake Lock во время заваривания | `brew` | `notify`, `beep`, `primeAudio`, `keepAwake`, `setToggle` | `firstbrew.settings.v1` | `free` |
| Оценка чашки 1–3 вкусовыми дескрипторами | `construct`, шаг 4 | `openBuilderRating`, `renderBuilderFeedback`, `updateFeedbackState`, `feedbackPayload` | варианты вкуса из `GET /api/catalog/options` | `free → member`: первая правка бесплатно |
| Оценка по рефрактометру | `construct`, шаг 4 | `feedbackMeasurement`, `renderBuilderFeedback` | `POST /api/recipes/adjust` | `free → member`: первая правка бесплатно |
| Диагноз и автоматическая правка не более двух параметров | `construct`, шаг 5 | `requestCorrection`, `renderBuilderCorrection`, `changeLine` | `POST /api/recipes/adjust` | `free → member`: первая правка бесплатно |
| Диаграмма экстракции/TDS или честная полоса оценки по вкусу | `construct`, шаг 5 | `extractionChart`, `renderBuilderCorrection` | геометрия из `POST /api/recipes/adjust` | `free → member`: вместе с правкой |
| Повторная оценка и последующие ревизии исправленного рецепта | `construct`, шаги 4–5 | `openBuilderRating`, `requestCorrection`, `brewCorrectedRecipe` | `POST /api/recipes/adjust` | `member` после бесплатной первой правки |
| Оценка и правка рецепта обжарщика через неизменённую копию | `recipe`, `brew`, `construct` | `rateRoasterRecipe`, `roasterSource`, `roasterChips` | `POST /api/recipes/adopt`, затем `POST /api/recipes/adjust` | рецепт и оценка `free`; первая правка `free`, далее `member` |
| Сохранение стартового или исправленного рецепта | `construct` | `toggleBuilderFavorite`, `saveOwnRecipe`, `newOwnEntry`, `saveOwnEntry` | `firstbrew.myRecipes.v1` | `free` до 3; без лимита `member` |
| Список «Мои рецепты» | `mine` | `ownEntries`, `renderMineEntry`, `renderMine` | `firstbrew.myRecipes.v1`, текущий технический максимум 50 | `free` до 3; без лимита `member`; сверх лимита существующие записи не удалять |
| Карточка своего рецепта, переименование, повтор и новая оценка | `own` | `openOwn`, `renderOwn`, `updateOwnEntry`, `brewOwn`, `rateOwnRecipe` | `firstbrew.myRecipes.v1`; оценка через `POST /api/recipes/adjust` | просмотр/повтор `free`; новые правки по общему лимиту |
| Копирование рецепта текстом | `own` | `ownText`, `shareOwn`, `copyText` | Clipboard API, без сервера | `free` для доступного сохранённого рецепта |
| Копирование/системная отправка ссылки на рецепт | `own` | `ownLink`, `shareOwn`, `streamBytes`, `base64url` | рецепт во fragment URL; сервер его не хранит | `free` |
| Импорт и проверка рецепта из ссылки | `own` | `readShareLink`, `openShareLink`, обработчик `hashchange` | `POST /api/recipes/import` | `free`; сохранение учитывает лимит своих рецептов |
| Удаление своего рецепта с подтверждением | `own` | `deleteOwn`, `wireOwn` | `firstbrew.myRecipes.v1` | `free` |
| Обнаружение машины и её состояния | `recipe`, `construct`, `own`, `brew` | `refreshMachine`, `connectMachineEvents`, `onMachineState`, `renderMachine` | `GET /api/machine`, `GET /api/machine/events` (SSE) | `machine` |
| Отправка совместимого рецепта обжарщика на машину | `recipe` | `startMachineBrew`, `machineRequest`, `updateCtaBar` | `POST /api/machine/recipe` | `machine`, всегда независимо от подписки |
| Отправка совместимого сохранённого рецепта на машину | `own` | `startMachineBrew`, `machineRequest`, `wireOwn` | `POST /api/machine/recipe` | `machine`, всегда независимо от подписки |
| Отправка нового расчётного/исправленного рецепта на машину | `construct` | `renderBuilderResult`, `renderBuilderCorrection`, `startMachineBrew` | `POST /api/machine/recipe` | `machine`; подписка не должна блокировать уже сохранённый рецепт |
| Управление машиной: старт, пауза, продолжение, остановка, повтор | `brew` | `machineToggle`, `machineCommand`, `machineStop`, `renderMachine` | `POST /api/machine/start|pause|resume|abort`; `tare` поддержан сервером | `machine`, без требования подписки |
| Опрос предзаказа и скидка | `find` | статическая ссылка, локализация в `localize` | внешняя Yandex Form, API приложения нет | `free`; в фазе 6 переносится на экран тарифов |
| RU/EN | `find`, `construct`, все локализуемые экраны | `localize`, `changeLanguage`, `t` | `firstbrew.settings.v1` | `free` |
| Светлая/тёмная тема и reduced motion | все | нативные media queries, JS не требуется | CSS `prefers-color-scheme`, `prefers-reduced-motion` | `free` |
| PWA-установка на главный экран | все | JS не требуется | `manifest.webmanifest`, иконки; service worker отсутствует | `free` |

## Функции, которых пока нет

Для последующих фаз нужно добавить поверх существующих API, не меняя смысл
каталога, OCR, рекомендателя, `build`, `adjust`, `rescale` и протокола машины:

- тарифы и единый модуль прав `entitlement()`, `can()` и `limit()`;
- общую шторку закрытой функции;
- развилку первого запуска и сохраняемый режим `learn` / `machine` / пропуск;
- Школу, уроки и эксперименты;
- дневник и экран прогресса;
- режимные варианты главного экрана;
- экран тарифов и демо-переключатели;
- отдельный доступ из настроек (самого экрана настроек сейчас нет).

## Предлагаемые идентификаторы прав для `data/plans.json`

Фаза 1 должна уточнить схему, но аудит уже выделяет единые точки проверки:

| Идентификатор | Смысл | Начальное правило |
| --- | --- | --- |
| `roaster_recipe` | поиск, фото, рецепт обжарщика и ручной таймер | всегда `free` |
| `builder_basic` | один стартовый расчётный рецепт | `free` |
| `builder_variants` | второй вариант «Ярче/Слаще» | `member` |
| `builder_pro` | Pro-поля конструктора | `member` |
| `recipe_rescale` | пересчёт дозы и воды | `member` |
| `recipe_adjust` | диагноз, правка и диаграмма | `free_adjustments: 1`, затем `member` |
| `own_recipes` | создание новых записей | `own_recipes_free_limit: 3`, затем `member` |
| `own_recipe_use` | просмотр и заваривание уже сохранённого | всегда `free` |
| `school_intro` | первый учебный модуль | `free` |
| `school_full` | остальные модули и эксперименты | `member` |
| `journal_recent` | последние три заваривания | `free` |
| `journal_full` | полный дневник и прогресс | `member` |
| `machine_brew` | передача рецепта и управление машиной | `machineOwner`; подписка не требуется |

`machine_brew` нельзя реализовывать как обычную проверку «минимальный платный
тариф». Это отдельная возможность владельца устройства. Серверный тест должен
явно фиксировать сценарий `plan: free` + `machineOwner: true` для сохранённого
рецепта и рецепта обжарщика.

## Текущие данные на устройстве

| Ключ | Что хранится сейчас | Влияние будущих фаз |
| --- | --- | --- |
| `firstbrew.settings.v1` | язык, звук, вибрация | расширять осторожно либо оставить отдельно от membership |
| `firstbrew.recentRecipes.v1` | до 8 небольших снимков рецептов обжарщика | не считать дневником и не дублировать в нём полный рецепт |
| `firstbrew.myRecipes.v1` | до 50 самодостаточных расчётных/исправленных рецептов | применить лимит только к созданию новых; существующие не удалять |
| `firstbrew.membership.v1` | отсутствует | добавить в фазе 1 |
| `firstbrew.school.v1` | отсутствует | добавить в фазе 3 |
| `firstbrew.journal.v1` | отсутствует | добавить в фазе 4; хранить ссылку на рецепт, не копию |

## Вывод аудита

Предлагаемое в задании распределение подтверждается текущей архитектурой. Главные
точки риска для следующих фаз — не размножить проверки прав по обработчикам,
сохранить бесплатный путь рецепта обжарщика, применять лимит «Моих рецептов» только
при создании и держать машинное право независимым от статуса membership.
