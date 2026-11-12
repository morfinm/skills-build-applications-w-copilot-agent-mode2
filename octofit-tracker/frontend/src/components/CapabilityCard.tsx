import { type ReactNode, useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  endpoint: string;
  emptyText: string;
  mapData: (payload: Record<string, unknown>) => T[];
  renderItem: (item: T, index: number) => ReactNode;
};

export function CapabilityCard<T>({ title, description, endpoint, emptyText, mapData, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const payload = await getJson<Record<string, unknown>>(endpoint);
        if (!isMounted) return;
        setItems(mapData(payload));
      } catch {
        if (!isMounted) return;
        setError(`Unable to load ${title.toLowerCase()}.`);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();
    return () => { isMounted = false; };
  }, [endpoint, title, mapData]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading && <p role="status">Loading...</p>}
        {!loading && error && <p role="alert">{error}</p>}
        {!loading && !error && items.length === 0 && <p>No {emptyText}</p>}
        {!loading && !error && items.length > 0 && (
          <ul className="mb-0">{items.map((item, index) => <li key={index}>{renderItem(item, index)}</li>)}</ul>
        )}
      </div>
    </section>
  );
}
