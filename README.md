# Tarazi — офлайн APK

Исходники в `src/` (стили, модули `src/js/*.js`, PWA-файлы); `python3 build.py` собирает из них `www/` и `dist/artifact.html`. Готовое приложение — один `index.html`, интернет не нужен: данные хранятся в памяти телефона.
Отчёты PDF/PNG/TXT/CSV сохраняются через меню «Поделиться» (Файлы, Диск, Telegram, WhatsApp).

## Как получить APK (без Android Studio)
1. Создайте на github.com новый репозиторий и загрузите в него все файлы этой папки (вместе с папкой `.github`).
2. Откройте вкладку **Actions** → **Build APK** → **Run workflow**. Сборка идёт 3–5 минут.
3. В готовом запуске внизу скачайте **tarazi-apk**, внутри лежит `app-debug.apk`.
4. Перенесите файл на телефон, откройте и разрешите установку из этого источника.

## Заметки
- Данные хранятся только на этом телефоне. Делайте резервную копию (Статистика → «Скачать резервную копию») перед удалением приложения.
- Для публикации в Google Play нужна подписанная release-сборка (`assembleRelease` + ключ).

## iPhone (и любой браузер)
Приложение работает как установленный сайт (PWA), App Store и Mac не нужны.
1. В репозитории: Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. После первой сборки **Deploy site** адрес будет `https://tarazi-app.github.io/Tarazi/`.
3. Откройте адрес в **Safari** на iPhone → кнопка «Поделиться» → **На экран «Домой»**.
4. Запускайте Tarazi с иконки: после первого открытия работает без интернета.


## Разработка и проверка
- Сборка: `python3 build.py` (версия из `BUILD_VERSION`, дата из `BUILD_DATE`; в CI версия = `1.<номер запуска>`).
- Тесты: `TARIZI_TEST=1 python3 build.py && node --test tests/*.test.js` (нужен `playwright`).

## Подписанный APK
Если в Settings → Secrets and variables → Actions заданы `KEYSTORE_BASE64`, `KEY_ALIAS`, `KEY_PASSWORD`, `STORE_PASSWORD`, Build APK выпускает подписанный `Tarazi-<версия>.apk`; иначе — отладочный `app-debug.apk`. Файл ключа в репозиторий не кладите и храните отдельно: без него обновить приложение нельзя.
