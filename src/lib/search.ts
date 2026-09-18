/** Строка для поиска: всё, по чему покупатель ищет товар, в нижнем регистре. */
export const searchTextOf = (p: { nameRu: string; nameUz: string; nameEn: string; brand: string; model: string }) =>
  [p.nameRu, p.nameUz, p.nameEn, p.brand, p.model].join(' ').toLowerCase()
