import { useARSession } from './useARSession';
export function useARBeauty() {
  const session = useARSession();
  return {
    intensity: session.beautyIntensity,
    setIntensity: (value: number) => session.controller.beauty(value),
  };
}
