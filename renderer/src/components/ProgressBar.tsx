import { ProgressEvent } from '../../electron/types';

interface Props {
  progress: ProgressEvent;
}

export default function ProgressBar({ progress }: Props) {
  const percent = progress.total ? Math.floor((progress.processed / progress.total) * 100) : 0;
  return (
    <div style={{ width: '100%', background: '#1f2937', borderRadius: 6, overflow: 'hidden' }}>
      <div
        style={{
          width: `${percent}%`,
          background: '#22c55e',
          height: 12,
          transition: 'width 0.2s ease'
        }}
      />
    </div>
  );
}
