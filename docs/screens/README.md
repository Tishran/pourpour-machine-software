# Фаза 1 — фото и подтверждение

Снимки сделаны в Playwright/Chrome: viewport 375×812, DPR 2, язык ru-RU.
Обе темы заданы через `prefers-color-scheme`. Это эмуляция, не реальный iOS Safari.

| Экран | Светлая тема | Тёмная тема |
| --- | --- | --- |
| 1. Поиск | [Снимок](1-find-light.png) | [Снимок](1-find-dark.png) |
| 2. Подтверждение OCR | [Снимок](2-confirm-light.png) | [Снимок](2-confirm-dark.png) |
| 3. Рецепт | [Снимок](3-recipe-light.png) | [Снимок](3-recipe-dark.png) |
| 4. Ручной таймер | [Снимок](4-brew-light.png) | [Снимок](4-brew-dark.png) |
| 5. Нечитаемое фото | [Снимок](5-unreadable-light.png) | [Снимок](5-unreadable-dark.png) |

Фикстура — синтетическая этикетка `ml/tests/fixtures/rwanda-label.png`; нечитаемый снимок —
пустое изображение через настоящий OCR. Исходные параметры «Руанда Суса» сохранены:
15 г, 250 г, 98 °C, 175 с, пять вливаний по 50 г. В режиме машины использован симулятор.
Файлы `2-recipe-*` и `3-brew-*` относятся к предыдущей версии трёх экранов.

Результаты проверки:

```text
webapp: Ran 52 tests in 13.653s — OK
ml:     Ran 19 tests in 1.283s  — OK
dataset: Ran 13 tests in 0.078s — OK
PASS iPhone SE, iPhone 13, Pixel 5
PASS recognition: language persistence, unreadable photo, explicit baseline,
     cancellation, corrected chips, catalog name correction, decaf caveat
PASS desktop: photo → confirmation → recipe, country-only photo,
     explicit unreadable fallback, timer, invalid upload, same-origin
PASS machine: heating → ready → pours → pause/resume → done → stop
```

В тестах проверяются навигация назад, видимость основных кнопок, отсутствие горизонтальной
прокрутки, неизменность рецепта источника и отсутствие фото/OCR в localStorage.

Допущения: выбран последний четырёхфазный план задания; выполнена только фаза 1.
Для локального прогона использован порт 8011, поскольку 8010 занят другим процессом.
Отмена останавливает ожидание в браузере, но уже запущенный OCR на сервере завершает работу
в пределах прежнего лимита 30 секунд. Настройки пока содержат переключатель языка;
расширение настроек, редактор и остальные фазы — после подтверждения владельца.
