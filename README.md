# BS+ Overlay

# Для пользователя
## Установка
Скачайте готовый `index.html` из GitHub Release, затем добавьте этот файл в OBS как `Browser Source` или локальный файл-источник, в зависимости от вашего сценария. Либо вы можете найти последнюю версию на https://knoot.github.io/bs-overlay/.

## Открытие настроек
Окно настроек открывается по нажатию `F2`.

У проекта два режима использования:
- локальная разработка
- запуск в GitHub Actions для тестов и релизной сборки

# Для разработки
## Файлы

- [docker-compose.yml]
  Базовый compose-файл для CI / release pipeline.
- [docker-compose.override.yml.dist]
  Шаблон локального dev-override.
- [Dockerfile]
  Образ для сборки и запуска через базовый compose.
- [Dockerfile.dev]
  Dev container для watcher-процесса.

## Почему так

`docker compose` автоматически читает:
- `docker-compose.yml`
- `docker-compose.override.yml`

Поэтому локальный dev-конфиг не хранится как активный override в репозитории. Вместо этого в репозитории лежит шаблон `docker-compose.override.yml.dist`.

Это нужно затем, чтобы:
- локальная dev-конфигурация не мешала GitHub Actions
- CI использовал только базовый `docker-compose.yml`
- разработчик мог включить dev-режим обычным `docker compose up`
- в локальной разработке сервис `overlay` переопределялся в watcher-контейнер, а `nginx` раздавал собранный `dist`

## Первый запуск локально

Windows PowerShell:

```powershell
Copy-Item docker-compose.override.yml.dist docker-compose.override.yml
```

Bash:

```bash
cp docker-compose.override.yml.dist docker-compose.override.yml
```

Файл `docker-compose.override.yml` добавлен в `.gitignore`, в репозиторий он не попадет.

## Локальная разработка

После создания `docker-compose.override.yml` можно запускать:

```bash
docker compose up
```

Что происходит:
- `overlay` при первом старте ставит зависимости в volume `overlay_node_modules`
- затем запускает `ng build --watch`
- watcher пересобирает Angular в `dist/overlay/browser`
- `nginx` раздает этот `dist`

Открывать:

```text
http://localhost:8080
```

Настройки можно переопределять query-параметрами. Если параметр передан в URL, он имеет приоритет над сохраненным `localStorage`.

Пример:

```text
http://localhost:8080/?lang=en&layout=top-right&scale=1.2&ws=ws://127.0.0.1:2947/socket&showBL=true&blId=76561198029377687
```

Кнопка `APPLY & RECONNECT`:
- сохраняет настройки в `localStorage`
- переписывает текущий URL query-параметрами

BeatLeader-блок в меню показывается только если одновременно:
- `showBL=true`
- передан непустой `blId`

Остановить:

```bash
docker compose down
```

Полный сброс dev-окружения вместе с volume:

```bash
docker compose down -v
```

## Что монтируется в dev

В dev-контейнер монтируются:
- `./src`
- `./dist`
- `./angular.json`
- `./package.json`
- `./tsconfig.json`
- `./tsconfig.app.json`

Отдельно используется volume:
- `overlay_node_modules`

Это позволяет:
- редактировать исходники на хосте
- получать пересборку без рестарта контейнера
- не bind-mount'ить `node_modules` с Windows

## GitHub Actions / CI

В CI нужно использовать только базовый файл:

```bash
docker compose -f docker-compose.yml up --build overlay
```

Важно:
- не создавать `docker-compose.override.yml` внутри CI
- не запускать compose так, чтобы случайно подтянулся локальный override
- в базовом `docker-compose.yml` не опубликованы порты, потому что для CI это обычно не нужно

Если в CI используется чистый checkout репозитория, то `docker-compose.override.yml` там и не появится.

## GitHub Actions

В репозитории используется один workflow:

- `.github/workflows/ci.yml`

Он запускается на:
- `push` в `main`, `dev`
- `push` тега `v*`
- `pull_request`
- `workflow_dispatch`

Содержит два job:

- `checks`
  Делает:
  - `npm install`
  - `npm run lint`
  - `npm test`
  - `npm run build:release`
  - `docker compose -f docker-compose.yml build overlay`

- `release`
  Запускается только после успешного `checks`.
  Делает:
  - использует `index.html`, собранный в `checks`
  - создание prerelease на каждый push в `dev` с тегом вида `dev-YYYYMMDD-NN`
  - создание обычного GitHub Release для tag-based запуска с приложенным `index.html`

- `pages`
  Запускается только для tag-based релизов `v*`.
  Делает:
  - берет уже собранный `index.html` из `checks`
  - публикует его в GitHub Pages
  - не запускается для prerelease из `dev`

Таким образом релиз больше не может пройти без успешного линта, тестов и сборки.

## Быстрые команды

Подготовить локальный override:

```powershell
Copy-Item docker-compose.override.yml.dist docker-compose.override.yml
```

Dev:

```bash
docker compose up
```

Dev reset:

```bash
docker compose down -v
```

Run tests:

```bash
docker compose run --rm overlay npm test
```

CI / release:

```bash
docker compose -f docker-compose.yml up --build overlay
```
