import { describe, expect, it } from 'vitest';
import { hasVisibleText } from './visible-text';

describe('hasVisibleText', () => {
  it('accepts text containing visible characters', () => {
    expect(hasVisibleText(' 课程介绍 ')).toBe(true);
  });

  it('rejects whitespace-only text', () => {
    expect(hasVisibleText(' \n\t')).toBe(false);
  });

  it('rejects zero-width-only text', () => {
    expect(hasVisibleText('\u200b\u200d\ufeff')).toBe(false);
  });
});
