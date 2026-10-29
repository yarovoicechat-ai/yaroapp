export const giftCategories = categories => {
  const byName = new Map();
  (Array.isArray(categories) ? categories : []).forEach(category => {
    if (category?.name && category.isActive !== false) byName.set(category.name.trim().toLowerCase(), category);
  });
  const popular = byName.get('popular') || { name: 'Popular', slug: 'popular', icon: '??' };
  byName.delete('popular'); byName.delete('all');
  return [{ ...popular, icon: popular.icon || '??' }, { name: 'All', slug: 'all' }, ...byName.values()];
};
export const giftMatchesCategory = (gift, category) => {
  const requested = String(category || 'all').trim().toLowerCase();
  if (requested === 'all') return true;
  const name = String(gift.categoryId?.name || gift.category || '').trim().toLowerCase();
  return name === requested || (requested === 'popular' && gift.isHot === true);
};
