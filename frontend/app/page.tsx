'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function Home() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => (await api.get('/health')).data,
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">⚽ Futbol al Toque</h1>
      <p className="text-gray-500">Conexión con el backend:</p>
      {isLoading && <span>Consultando…</span>}
      {isError && (
        <span className="text-red-600">❌ Sin conexión con la API</span>
      )}
      {data && (
        <pre className="rounded bg-gray-100 p-4 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
