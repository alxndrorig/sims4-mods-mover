import { FileType, ScanSummary } from '../../electron/types';

interface Props {
  summary?: ScanSummary;
  selected: FileType | 'all';
  onSelect: (type: FileType | 'all') => void;
}

const labels: Record<FileType | 'all', string> = {
  all: 'Все',
  mod: 'Моды',
  tray: 'Трей',
  save: 'Сейвы',
  archive: 'Архивы',
  trash: 'Мусор',
  unknown: 'Неизвестно'
};

export default function Summary({ summary, selected, onSelect }: Props) {
  const counts = summary || { mod: 0, tray: 0, save: 0, archive: 0, trash: 0, unknown: 0, total: 0 };
  const order: (FileType | 'all')[] = ['all', 'mod', 'tray', 'save', 'archive', 'trash', 'unknown'];

  const getCount = (type: FileType | 'all') => {
    if (type === 'all') return counts.total;
    return counts[type];
  };

  return (
    <div>
      <h3>Сводка</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {order.map((type) => (
          <button
            key={type}
            style={{
              background: selected === type ? 'var(--pill-active-bg)' : 'var(--pill-bg)'
            }}
            onClick={() => onSelect(type)}
          >
            {labels[type]} <span className="badge">{getCount(type)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
