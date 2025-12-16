import { LogMessage } from '../../electron/types';

interface Props {
  logs: LogMessage[];
}

const levelColor: Record<LogMessage['level'], string> = {
  info: 'var(--accent)',
  warn: '#fbbf24',
  error: 'var(--danger)'
};

export default function Logs({ logs }: Props) {
  return (
    <div>
      <h3>Логи</h3>
      <div style={{ maxHeight: 200, overflow: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
        {logs.map((log, idx) => (
          <div key={idx} style={{ color: levelColor[log.level] }}>
            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
          </div>
        ))}
        {!logs.length && <div style={{ color: 'var(--muted)' }}>Пока нет событий</div>}
      </div>
    </div>
  );
}
