import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { Select } from '../ui/Select.jsx';

import { categoryService } from '../../services/categories.js';
import { Plus, Check } from 'lucide-react';
import { useToast } from '../ui/Toast.jsx';

export function TransactionForm({ onSubmit, onCancel, initialData = {} }) {
  const [formData, setFormData] = useState({
    description: initialData.description || '',
    amount: initialData.amount || '',
    type: initialData.type || 'EXPENSE',
    category_id: initialData.category_id || '',
    occurred_at: initialData.occurred_at 
      ? new Date(initialData.occurred_at).toISOString().slice(0, 16) 
      : (() => {
          const now = new Date();
          now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
          return now.toISOString().slice(0, 16);
        })()
  });

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
      if (!newCategoryName.trim()) return;
      try {
          const newCat = await categoryService.create({ name: newCategoryName, color: '#8b5cf6' });
          setCategories([...categories, newCat]);
          setFormData({ ...formData, category_id: newCat.id });
          setNewCategoryName('');
          setIsCreatingCategory(false);
          toast.success('Category created');
      } catch {
          toast.error('Failed to create category');
      }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id || null // Send null if empty string
    });
  };

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-400">Description</label>
        <Input 
          required
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="e.g. Grocery Store"
        />
      </div>

       <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-400">Category</label>
        
        {!isCreatingCategory ? (
            <div className="flex gap-2">
                 <div className="flex-1">
                    <Select 
                        options={categoryOptions}
                        value={formData.category_id}
                        onChange={(val) => setFormData({...formData, category_id: val})}
                        placeholder={isLoading ? "Loading categories..." : "Select a category"}
                        searchable={true}
                    />
                 </div>
                 <Button 
                    type="button" 
                    variant="outline" 
                    className="border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
                    onClick={() => setIsCreatingCategory(true)}
                 >
                    <Plus size={16} />
                 </Button>
            </div>
        ) : (
             <div className="flex gap-2 animate-fade-in">
                <Input 
                    value={newCategoryName} 
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name..."
                    autoFocus
                />
                <Button type="button" variant="gradient" onClick={handleCreateCategory}>
                   <Check size={16} />
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsCreatingCategory(false)}>
                   Cancel
                </Button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Amount</label>
            <Input 
                required
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
            />
        </div>
        <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Type</label>
            <Select 
                options={[
                    { value: 'EXPENSE', label: 'Expense' },
                    { value: 'INCOME', label: 'Income' }
                ]}
                value={formData.type}
                onChange={(val) => setFormData({...formData, type: val})}
            />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-400">Date & Time</label>
        <Input 
          type="datetime-local"
          value={formData.occurred_at}
          onChange={(e) => setFormData({...formData, occurred_at: e.target.value})}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient">
          Save Transaction
        </Button>
      </div>
    </form>
  );
}
