export const CALL_DIAMONDS_PER_MINUTE = 100;

export const hasCallStartIdentity = data =>
  Boolean(
    data &&
    typeof data === 'object' &&
    String(data.transactionId || '').trim() &&
    String(data.channelName || '').trim()
  );

export const parseAgoraPayload = value => {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
};

export const getRoleAgoraCredentials = (value, isCaller) => {
  const agora = parseAgoraPayload(value);
  const token = isCaller ? agora.callerToken : agora.hostToken;
  const rawUid = isCaller ? agora.callerAgoraUid : agora.hostAgoraUid;
  const uid = Number(rawUid);
  const appId = typeof agora.appId === 'string' ? agora.appId.trim() : '';

  if (
    !appId ||
    typeof token !== 'string' ||
    !token.trim() ||
    !Number.isInteger(uid) ||
    uid < 0 ||
    uid > 4294967295
  ) {
    return null;
  }
  return { appId, token: token.trim(), uid, agora };
};

export const getValidOngoingCall = (data, isCaller) => {
  if (!hasCallStartIdentity(data)) return null;
  const credentials = getRoleAgoraCredentials(data.agora, isCaller);
  if (!credentials) return null;
  return {
    transactionId: String(data.transactionId),
    channelName: String(data.channelName),
    agora: credentials.agora,
  };
};