// Profile actions pass a name; other room actions may pass a user object.
export const appendRoomMention = (currentText, target) => {
  const candidates = typeof target === 'string' ? [target] : [target?.name, target?.userName, target?.displayName];
  const name = candidates.find(value => typeof value === 'string' && value.trim() && !/^(undefined|null)$/i.test(value.trim()));
  if (!name) return currentText || '';
  return `${currentText ? currentText.trimEnd() + ' ' : ''}@${name.trim().replace(/^@+/, '')} `;
};
