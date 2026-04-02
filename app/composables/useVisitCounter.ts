export function useVisitCounter() {
  const count = useState('visitCount', () => 0)
  return { count }
}
