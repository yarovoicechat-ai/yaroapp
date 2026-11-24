import { DeviceEventEmitter } from 'react-native';

const cleanupBySocket = new WeakMap();
export const attachSocketListeners = (socket, setHosts) => {
  if (!socket) return;
  cleanupBySocket.get(socket)?.();
  const update = data => setHosts(data?.hosts || data);
  const handleVideoPermission = (data) => {
    DeviceEventEmitter.emit('user:video_permission_updated', data);
  };
  socket.on('hostsList', update);
  socket.on('hostsUpdated', update);
  socket.on('user:video_permission_updated', handleVideoPermission);
  const cleanup = () => {
    socket.off('hostsList', update);
    socket.off('hostsUpdated', update);
    socket.off('user:video_permission_updated', handleVideoPermission);
  };
  cleanupBySocket.set(socket, cleanup);
  return cleanup;
};
