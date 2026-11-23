# Быстрый поиск жилья · Циан

## Статус

Готова вторая, более динамичная версия вертикального MP4 без озвучки и музыки: `out/home-search_9x16.mp4`.

- 15 секунд, 1080×1920, 30 fps, H.264.
- Размер: 6.5 МБ (ограничение 20 МБ соблюдено).
- Бренд-профиль: `brand/` — снимок `../brand` на момент создания.

## Решения брифа

Ролик показывает реальный мобильный прототип: главная → форма «Купить квартиру» с Ясенево, двумя комнатами и бюджетом → сохранённый поиск на главной. Кадры сняты Playwright из работающего прототипа в `capture_screens.py`; вымышленных экранов и текстов нет. Вторая версия добавляет синие фирменные переходы, параллакс, масштабирование экранов и оранжевый акцент сохранённого поиска. Формат выбран 9:16, так как исходный продукт — мобильная главная. Аудиодорожки нет по брифу.

## Пересборка

```sh
# В одном терминале из корня проекта
node server.js

# Во втором терминале из корня проекта
.agents/skills/product-motion/.venv/bin/python motion/home-search/capture_screens.py
.agents/skills/product-motion/.venv/bin/python .agents/skills/product-motion/scripts/verify_scene.py motion/home-search/video.html --fmt v
.agents/skills/product-motion/.venv/bin/python .agents/skills/product-motion/scripts/render.py motion/home-search/video.html video --fmt v --out motion/home-search/out/home-search_9x16.mp4
```

Промежуточные кадры и проверки лежат в `build/`; итоговый файл — в `out/`.
