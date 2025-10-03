
# fuck-u-code [![Русский](https://img.shields.io/badge/Docs-Русский-blue?style=flat-square)](README_RU.md) [![English](https://img.shields.io/badge/Docs-English-red?style=flat-square)](README_EN.md) [![中文](https://img.shields.io/badge/文档-简体中文-blue?style=flat-square)](README.md) 

> [!Важно]
> 📢 Запомните данную команду: `fuck-u-code` - пусть плохому коду негде будет спрятаться!

Инструмент, предназначенный для того, чтобы **выявлять дерьмовое качество кода ** с помощью резких, но юмористических отзывов, показывая вам, насколько ужасен ваш код**.

## Особбенности

* **Поддержка нескольких языков**: Go, JS/TS, Python, Java, C/C++
* **Индекс Shit-Mountain**: Оценка от 0 до 100, чем выше, тем хуже.
* **Семь проверок качества**: Сложность / Длина функции / Комментарии / Обработка ошибок / Именование / Дублирование / Структура
* **Красочный отчет терминала**: Критика, над которой вы можете посмеяться
* **Вывод Markdown**: Простота анализа и документирования с помощью искусственного интеллекта
* **Гибкая настройка**: Сводный / подробный режим, многоязычные отчеты

> [!Примечание]
>
> * Чем больше баллов, тем хуже код. Приветствуем тех, кто набрал больше очков!   
> * Работает полностью автономно. Ваш код никогда не покидает ваш компьютер.

## Установка

```bash
# Метод 1: Установка через Go
go install github.com/Done-0/fuck-u-code/cmd/fuck-u-code@latest

# Метод 2: Сборка из исходников
git clone https://github.com/Done-0/fuck-u-code.git
cd fuck-u-code && go build -o fuck-u-code ./cmd/fuck-u-code

# Метод 3: Сборка с помощью Docker
docker build -t fuck-u-code .
````

## Использование

```bash
# Базовый анализ - локальный проект
fuck-u-code analyze /path/to/project
# Или
fuck-u-code /path/to/project

# Анализ Git репозитория (автоматическое клонирование)
fuck-u-code analyze https://github.com/user/repo.git
# Или
fuck-u-code https://github.com/user/repo

# Запуск с помощью Docker
docker run --rm -v "/path/to/project:/build" fuck-u-code analyze

# По-умолчанию: анализ текущей директории
fuck-u-code analyze
```

> [!Tip]
> **Поддержка прямого анализа Git репозиториев**: Инструмент автоматически клонирует репозитории во временный каталог `tmp_proj` и очищает его после анализа. Поддерживает GitHub, GitLab, Gitee, Bitbucket и другие платформы.

### Общие параметры

| Опция         | Короткая команда | Описание                               |
| ------------- | ----- | --------------------------------------------------|
| `--verbose`   | `-v`  | Показать детальный отчет                          |
| `--top N`     | `-t`  | Показать худшие N файлов                          |
| `--issues N`  | `-i`  | Показать N проблем в каждом файле                 |
| `--summary`   | `-s`  | Показывать только сводку, подробности пропускать  |
| `--markdown`  | `-m`  | Выводится в виде отчета Markdown                  |
| `--lang`      | `-l`  | Report language (zh-CN, en-US, ru-RU)             |
| `--exclude`   | `-e`  | Исключить определенные файлы или папки            |
| `--skipindex` | `-x`  | Пропускать файлы index.js/ts                      |

### Примеры

```bash
fuck-u-code analyze --verbose
fuck-u-code analyze --top 3
fuck-u-code analyze --lang en-US
fuck-u-code analyze --summary
fuck-u-code analyze --exclude "**/test/**"
fuck-u-code analyze --markdown > report.md
```

## Расширенное Использование

### Markdown вывод

Идеально подходит **ИИ аналитика, документация, CI/CD, совместная командная работа**

```bash
fuck-u-code analyze --markdown
fuck-u-code analyze --markdown > report.md
fuck-u-code analyze --markdown --top 10 --lang en-US > report.md
```

Отчет Markdown включает в себя: общую оценку / таблицу показателей / проблемные файлы / предложения

### Исключения по умолчанию

* Frontend: `node_modules`, `dist`, `build`, `*.min.js`, etc.
* Backend: `vendor`, `bin`, `target`, `logs`, `migrations`, etc.

## Диагностика

* `command not found` → Добавьте путь к ячейке Go bin в `PATH`:

  ```bash
  export PATH="$PATH:$(go env GOPATH)/bin"
  ```

  Add it to `.bash_profile` / `.zshrc` etc.

## License

MIT

## Contributing

PRs welcome — let’s improve **fuck-u-code** together 🚀

## More Projects

- [Xuanxue Workshop](https://bazi.site) — AI-powered fortune-telling website  
- [Jank](https://github.com/Done-0/Jank) — Open-source blog system in Go
