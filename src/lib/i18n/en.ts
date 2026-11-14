import type { Messages } from './ru'

const en: Messages = {
  app: {
    name: 'KyialPrint',
    tagline: 'Colouring books & Velcro books',
  },
  tabs: {
    dashboard: 'Home',
    orders: 'Orders',
    expenses: 'Expenses',
    settings: 'Settings',
  },
  common: {
    add: 'Add',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    delete: 'Delete',
    edit: 'Edit',
    undo: 'Undo',
    confirm: 'Confirm',
    search: 'Search',
    loading: 'Loading…',
    comingSoon: 'Something lovely is coming here ✨',
    deleted: 'Deleted',
  },
  fab: {
    newOrder: 'New order',
    newExpense: 'New expense',
    newAd: 'New ad',
  },
  dashboard: {
    title: 'Hi there! 👋',
    subtitle: "Here's how the studio is doing",
    empty: 'No data yet. Add your first order and your stats will show up here.',
  },
  orders: {
    title: 'Orders',
    empty: 'No orders yet. Tap “+” to add your first one!',
    count_one: '{n} order',
    count_few: '{n} orders',
    count_many: '{n} orders',
    count_other: '{n} orders',
  },
  expenses: {
    title: 'Expenses',
    tabExpenses: 'Expenses',
    tabAds: 'Ads',
    empty: 'No expenses yet. Paper, printing, felt: it all goes here.',
  },
  validation: {
    required: 'Please fill this in',
    invalidNumber: 'Enter a number, e.g. 850',
    positive: 'Amount must be greater than zero',
    nonNegative: "Can't be less than zero",
    integer: 'Must be a whole number',
    tooLarge: 'Value is too large',
    tooLong: 'Text is too long',
    invalidPhone: 'Check the phone number',
    invalidDate: 'Invalid date',
    futureDate: "Date can't be in the future",
    exceedsPrice: 'More than the order price',
    invalidOption: 'Pick an option from the list',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
  },
}

export default en
