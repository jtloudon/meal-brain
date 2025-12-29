'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewGroceryListPage() {
  const router = useRouter();
  const [listName, setListName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!listName.trim()) return;

    try {
      setSaving(true);
      const res = await fetch('/api/grocery/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: listName }),
      });

      if (res.ok) {
        router.push('/groceries');
      }
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => router.push('/groceries')}
          disabled={saving}
          style={{
            color: '#f97316',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
          Create new list
        </h3>
        <button
          onClick={handleCreate}
          disabled={saving || !listName.trim()}
          style={{
            color: saving || !listName.trim() ? '#d1d5db' : '#f97316',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: saving || !listName.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Creating...' : 'Create'}
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <input
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="List name (e.g., Weekly Groceries)"
          style={{
            width: '100%',
            fontSize: '16px',
            padding: '12px 0',
            border: 'none',
            borderBottom: '1px solid #e5e7eb',
            outline: 'none'
          }}
          autoFocus
        />
      </div>
    </div>
  );
}
