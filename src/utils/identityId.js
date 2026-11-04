// Badge labels do not turn a permanent numeric ID into a unique ID.
export const resolveDisplayId = ({ userId, officialDisplayId, customDisplayId, isOfficial = false }) => {
  const clean = value => value == null ? '' : String(value).trim();
  const permanentId = clean(userId);
  const official = clean(officialDisplayId);
  const custom = clean(customDisplayId);
  const effectiveId = (isOfficial && official) || custom || official || permanentId;
  return { effectiveId, isUnique: Boolean(effectiveId && (isOfficial || ((custom || official) && effectiveId !== permanentId))) };
};
