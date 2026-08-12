import { describe, expect, it } from 'vitest';
import { getIntroductionView } from './utils';

describe('getIntroductionView', () => {
  it('prefers Chinese text for the collapsed preview', () => {
    expect(getIntroductionView({ zh: '中文简介', en: 'English' })).toEqual({
      empty: false,
      preview: '中文简介',
      showZh: true,
      showEn: true,
    });
  });

  it('falls back to English when Chinese is empty', () => {
    expect(getIntroductionView({ zh: ' ', en: 'English' })).toEqual({
      empty: false,
      preview: 'English',
      showZh: false,
      showEn: true,
    });
  });

  it('marks the card empty when both languages are blank', () => {
    expect(getIntroductionView({ zh: '', en: ' ' })).toEqual({
      empty: true,
      preview: '',
      showZh: false,
      showEn: false,
    });
  });
});
