import { describe, expect, it } from 'vitest';
import { getIntroductionView } from './utils';

describe('getIntroductionView', () => {
  it('prefers Chinese text for the collapsed preview', () => {
    expect(
      getIntroductionView({ zh: '中文简介', en: 'English' }, false)
    ).toEqual({
      empty: false,
      preview: '中文简介',
      showPreview: true,
      showZh: true,
      showEn: true,
    });
  });

  it('falls back to English when Chinese is empty', () => {
    expect(getIntroductionView({ zh: ' ', en: 'English' }, false)).toEqual({
      empty: false,
      preview: 'English',
      showPreview: true,
      showZh: false,
      showEn: true,
    });
  });

  it('marks the card empty when both languages are blank', () => {
    expect(getIntroductionView({ zh: '', en: ' ' }, false)).toEqual({
      empty: true,
      preview: '',
      showPreview: false,
      showZh: false,
      showEn: false,
    });
  });

  it('hides the preview while the card is expanded', () => {
    expect(
      getIntroductionView({ zh: '中文简介', en: 'English' }, true).showPreview
    ).toBe(false);
  });
});
