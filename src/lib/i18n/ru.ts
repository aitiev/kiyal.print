/**
 * Russian dictionary: the source of truth for every UI string.
 * `en.ts` must satisfy `Messages`, so a missing key fails the typecheck.
 * Plurals: give `_one`, `_few`, `_many`, `_other` variants and call `tp(key, n)`.
 */
const ru = {
  app: {
    name: 'KyialPrint',
    tagline: 'Раскраски и книжки на липучках',
  },
  tabs: {
    dashboard: 'Главная',
    orders: 'Заказы',
    expenses: 'Расходы',
    settings: 'Настройки',
  },
  common: {
    add: 'Добавить',
    save: 'Сохранить',
    cancel: 'Отмена',
    close: 'Закрыть',
    delete: 'Удалить',
    edit: 'Изменить',
    undo: 'Вернуть',
    confirm: 'Подтвердить',
    search: 'Поиск',
    loading: 'Загрузка…',
    comingSoon: 'Скоро здесь будет красиво ✨',
    deleted: 'Удалено',
  },
  fab: {
    newOrder: 'Новый заказ',
    newExpense: 'Новый расход',
    newAd: 'Новая реклама',
  },
  dashboard: {
    title: 'Привет! 👋',
    subtitle: 'Вот как идут дела в мастерской',
    empty: 'Пока нет данных. Добавьте первый заказ — и здесь появится статистика.',
  },
  orders: {
    title: 'Заказы',
    empty: 'Заказов пока нет. Нажмите «+», чтобы добавить первый!',
    count_one: '{n} заказ',
    count_few: '{n} заказа',
    count_many: '{n} заказов',
    count_other: '{n} заказа',
  },
  expenses: {
    title: 'Расходы',
    tabExpenses: 'Расходы',
    tabAds: 'Реклама',
    empty: 'Расходов пока нет. Бумага, печать, фетр — всё сюда.',
  },
  validation: {
    required: 'Заполните это поле',
    invalidNumber: 'Введите число, например 850',
    positive: 'Сумма должна быть больше нуля',
    nonNegative: 'Не может быть меньше нуля',
    integer: 'Нужно целое число',
    tooLarge: 'Слишком большое значение',
    tooLong: 'Слишком длинный текст',
    invalidPhone: 'Проверьте номер телефона',
    invalidDate: 'Неверная дата',
    futureDate: 'Дата не может быть в будущем',
    exceedsPrice: 'Больше, чем цена заказа',
    invalidOption: 'Выберите вариант из списка',
  },
  settings: {
    title: 'Настройки',
    language: 'Язык',
    theme: 'Тема',
    themeSystem: 'Как в системе',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
  },
} 

export type Messages = typeof ru
export default ru
