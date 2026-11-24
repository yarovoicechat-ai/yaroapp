import { DeviceEventEmitter } from 'react-native';

const cleanupBySocket = new WeakMap();
export const attachSocketListeners = (socket, setHosts) => {
  if (!socket) return;
  cleanupBySocket.get(socket)?.();
  const update = data => setHosts(data?.hosts || data);
  const handleVideoPermission = (data) => {
    DeviceEventEmitter.emit('user:video_permission_updated', data);
  };
  const handleForceLogout = (data) => {
    if (
      data?.code === 'ACCOUNT_BANNED' ||
      data?.code === 'DEVICE_BANNED' ||
      data?.errorCode === 'ACCOUNT_BANNED' ||
      data?.errorCode === 'DEVICE_BANNED'
    ) {
      DeviceEventEmitter.emit('AUTH_BANNED_EVENT', data);
    }
  };
  socket.on('hostsList', update);
  socket.on('hostsUpdated', update);
  socket.on('user:video_permission_updated', handleVideoPermission);
  socket.on('force_logout', handleForceLogout);
  const cleanup = () => {
    socket.off('hostsList', update);
    socket.off('hostsUpdated', update);
    socket.off('user:video_permission_updated', handleVideoPermission);
    socket.off('force_logout', handleForceLogout);
  };
  cleanupBySocket.set(socket, cleanup);
  return cleanup;
};
