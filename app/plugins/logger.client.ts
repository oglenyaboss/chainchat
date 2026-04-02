export default defineNuxtPlugin(() => {
  const history = useState<{ level: string; message: string; time: string }[]>(
    'loggerHistory',
    () => [],
  )

  function log(level: string, message: string) {
    const entry = {
      level,
      message,
      time: new Date().toLocaleTimeString('ru-RU'),
    }
    history.value = [...history.value, entry]

    if (level === 'warn') {
      console.warn(`[WARN] ${message}`)
    } else if (level === 'error') {
      console.error(`[ERROR] ${message}`)
    } else {
      console.log(`[INFO] ${message}`)
    }
  }

  return {
    provide: {
      logger: {
        info: (msg: string) => log('info', msg),
        warn: (msg: string) => log('warn', msg),
        error: (msg: string) => log('error', msg),
        history,
      },
    },
  }
})
