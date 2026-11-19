import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { ARManager } from '../core/ARManager';
export function useARSession() {
  const state = useSyncExternalStore(
    ARManager.subscribe,
    ARManager.getSnapshot,
    ARManager.getSnapshot,
  );
  useEffect(() => {
    void ARManager.inspect().catch(error =>
      ARManager.update({ error: error.message }),
    );
  }, []);
  return { ...state, controller: ARManager };
}
export function useARLifecycle() {
  useEffect(() => {
    let resumeAfterBackground = false;
    const subscription = AppState.addEventListener('change', state => {
      ARManager.setForeground(state === 'active');
      if (state !== 'active' && ARManager.getSnapshot().status === 'running')
        resumeAfterBackground = true;
      const operation =
        state === 'active'
          ? resumeAfterBackground
            ? ARManager.resume()
            : Promise.resolve()
          : ARManager.pause();
      if (state === 'active') resumeAfterBackground = false;
      void operation.catch(error => ARManager.update({ error: error.message }));
    });
    return () => subscription.remove();
  }, []);
}
