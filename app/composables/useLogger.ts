export function useLogger() {
  const { $logger } = useNuxtApp()
  return $logger
}
