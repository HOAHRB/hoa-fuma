const INVISIBLE_CHARACTERS = /[\s\u200b-\u200d\ufeff]/gu;

export function hasVisibleText(value: string | null | undefined): boolean {
  return Boolean(value?.replace(INVISIBLE_CHARACTERS, ''));
}
