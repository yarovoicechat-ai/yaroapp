const cleanupBySocket = new WeakMap();
export const attachSocketListeners = (socket, setHosts) => {
  if (!socket) return;
  cleanupBySocket.get(socket)?.();
  const update = data => setHosts(data?.hosts || data);
  socket.on('hostsList', update);
  socket.on('hostsUpdated', update);
  const cleanup = () => { socket.off('hostsList', update); socket.off('hostsUpdated', update); };
  cleanupBySocket.set(socket, cleanup);
  return cleanup;
};
