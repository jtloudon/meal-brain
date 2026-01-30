'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, ArrowLeft } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

interface GroceryList {
  id: string;
  name: string;
}

export default function ShoppingListSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [defaultListId, setDefaultListId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchGroceryLists();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/settings/shopping-categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      } else {
        // If no saved categories yet, initialize with defaults
        const defaultCategories = [
          'Produce',
          'Meat & Seafood',
          'Dairy & Eggs',
          'Bakery',
          'Frozen',
          'Canned Goods',
          'Condiments & Sauces',
          'Beverages',
          'Snacks & Treats',
          'Pantry',
          'Household',
          'Other',
        ];
        setCategories(defaultCategories);
        // Save defaults to database for first-time users
        await saveCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) {
      return;
    }

    const updatedCategories = [...categories, newCategory.trim()];
    setCategories(updatedCategories);
    setNewCategory('');
    await saveCategories(updatedCategories);
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    if (categoryToDelete === 'Other') {
      alert('Cannot delete the "Other" category');
      return;
    }

    const updatedCategories = categories.filter(c => c !== categoryToDelete);
    setCategories(updatedCategories);
    await saveCategories(updatedCategories);
  };

  const saveCategories = async (updatedCategories: string[]) => {
    try {
      setSaving(true);
      await fetch('/api/settings/shopping-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updatedCategories }),
      });
    } catch (error) {
      console.error('Error saving categories:', error);
    } finally {
      setSaving(false);
    }
  };

  const fetchGroceryLists = async () => {
    try {
      // Fetch all grocery lists
      const listsRes = await fetch('/api/grocery/lists');
      if (listsRes.ok) {
        const listsData = await listsRes.json();
        setGroceryLists(listsData.lists || []);
      }

      // Fetch current default list from preferences
      const prefsRes = await fetch('/api/user/preferences');
      if (prefsRes.ok) {
        const prefsData = await prefsRes.json();
        setDefaultListId(prefsData.default_grocery_list_id);
      }
    } catch (error) {
      console.error('Error fetching grocery lists:', error);
    }
  };

  const handleSetDefaultList = async (listId: string) => {
    try {
      setSaving(true);
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_grocery_list_id: listId }),
      });

      if (res.ok) {
        setDefaultListId(listId);
      }
    } catch (error) {
      console.error('Error setting default list:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthenticatedLayout
      title={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: 'fit-content',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '22px',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.12)',
          padding: '0 14px 0 6px',
          height: '44px',
        }}>
          <button
            onClick={() => router.push('/settings')}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '1px solid var(--theme-primary)',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={16} style={{ color: 'var(--theme-primary)', strokeWidth: 2 }} />
          </button>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap' }}>
            Shopping list
          </span>
        </div>
      }
    >
      <div style={{ padding: '16px 16px 80px 16px' }}>
        {loading ? (
          <p style={{ color: '#6b7280', textAlign: 'center' }}>Loading...</p>
        ) : (
          <div>
          {/* Default Grocery List Section */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--theme-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Default Grocery List
            </h4>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
              Pre-selected when adding ingredients from recipes
            </p>
            <select
              value={defaultListId || ''}
              onChange={(e) => handleSetDefaultList(e.target.value)}
              disabled={saving || groceryLists.length === 0}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                color: '#111827',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1
              }}
            >
              <option value="">None (always ask)</option>
              {groceryLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          {/* Categories Section */}
          <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--theme-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Edit/reorder shopping list categories
          </h4>

          {/* Add new category */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            backgroundColor: '#f9fafb',
            padding: '8px',
            borderRadius: '8px'
          }}>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add new"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '16px',
                color: '#9ca3af',
                outline: 'none'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAddCategory();
              }}
            />
            <button
              onClick={handleAddCategory}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              <Plus size={24} />
            </button>
          </div>

          {/* Category list */}
          <div>
            {categories.map((category, index) => (
              <div
                key={category}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 0',
                  borderBottom: index < categories.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}
              >
                <span style={{ fontSize: '16px', color: '#111827', flex: 1 }}>
                  {category}
                </span>
                <button
                  onClick={() => handleDeleteCategory(category)}
                  disabled={saving || category === 'Other'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: category === 'Other' || saving ? 'not-allowed' : 'pointer',
                    color: category === 'Other' ? '#d1d5db' : '#ef4444',
                    padding: '4px',
                    opacity: saving ? 0.5 : 1
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
