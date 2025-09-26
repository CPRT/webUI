import React, { useEffect, useState } from 'react';
import ContainerCard, { ContainerOption } from './ContainerCard';


const ContainerList: React.FC = () => {
  const [options, setOptions] = useState<ContainerOption[]>([]);

  useEffect(() => {
    fetchOptions();
  }, []);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

  const fetchOptions = async () => {
    const res = await fetch(`${API_BASE}/options`);
    const data: ContainerOption[] = await res.json();
    setOptions(data);
  };

  const startContainer = async (key: string) => {
    await fetch(`${API_BASE}/start/${key}`, { method: 'POST' });
    await fetchOptions();
  };

  const stopContainer = async (id: string | null) => {
  if (!id) return;
    await fetch(`${API_BASE}/stop/${id}`, { method: 'POST' });
    await fetchOptions();
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Docker Launch Options</h2>
      {options.map((opt) => (
        <ContainerCard
          key={opt.key}
          option={opt}
          onStart={startContainer}
          onStop={stopContainer}
        />
      ))}
    </div>
  );
};

export default ContainerList;