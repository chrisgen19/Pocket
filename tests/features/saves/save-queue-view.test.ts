import { describe, expect, it } from 'vitest';
import { listsNewSave, type QueueView, showsPendingRows } from '@/features/saves/save-queue-store';

const view = (overrides: Partial<QueueView> = {}): QueueView => ({
  category: 'home',
  tagFilter: null,
  searching: false,
  ...overrides,
});

describe('showsPendingRows', () => {
  it('shows pending and failed rows in every saves view', () => {
    expect(showsPendingRows(view())).toBe(true);
    expect(showsPendingRows(view({ category: 'favorites' }))).toBe(true);
    expect(showsPendingRows(view({ category: 'archive' }))).toBe(true);
    expect(showsPendingRows(view({ tagFilter: 'design' }))).toBe(true);
  });

  it('hides them while searching and off the saves pages', () => {
    expect(showsPendingRows(view({ searching: true }))).toBe(false);
    expect(showsPendingRows(null)).toBe(false);
  });
});

describe('listsNewSave', () => {
  it('lists a new save in Home', () => {
    expect(listsNewSave(view(), [])).toBe(true);
  });

  it('lists it in a tag view only when it has that tag (any case)', () => {
    expect(listsNewSave(view({ tagFilter: 'Design' }), ['design'])).toBe(true);
    expect(listsNewSave(view({ tagFilter: 'design' }), ['css'])).toBe(false);
  });

  it('does not list it in Favorites, Archive, a search or another page', () => {
    expect(listsNewSave(view({ category: 'favorites' }), [])).toBe(false);
    expect(listsNewSave(view({ category: 'archive' }), [])).toBe(false);
    expect(listsNewSave(view({ searching: true }), [])).toBe(false);
    expect(listsNewSave(null, [])).toBe(false);
  });
});
