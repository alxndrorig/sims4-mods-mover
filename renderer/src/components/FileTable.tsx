import { ScanItem, FileType } from '../../electron/types';

interface Props {
  items: ScanItem[];
  typeFilter: FileType | 'all';
}

function formatSize(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function FileTable({ items, typeFilter }: Props) {
  return (
    <div>
      <h3>Файлы ({typeFilter === 'all' ? 'все категории' : typeFilter})</h3>
      <div style={{ maxHeight: 300, overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Тип</th>
              <th>Размер</th>
              <th>Обновлен</th>
              <th>Путь</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.path}>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>{formatSize(item.size)}</td>
                <td>{new Date(item.mtime).toLocaleString()}</td>
                <td>{item.relativePath}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                  Нет файлов
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
