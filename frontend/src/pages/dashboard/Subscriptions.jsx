import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Plus, Edit, Trash2, Calendar, CheckCircle } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptions.js';
import { categoryService } from '../../services/categories.js';
import { cn } from '../../lib/utils';
import { useToast } from '../../components/ui/Toast.jsx';

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billing_cycle: 'monthly',
    category_id: ''
  });
  const toast = useToast();

  useEffect(() => {
    loadSubscriptions();
    loadCategories();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const data = await subscriptionService.getAll();
      setSubscriptions(data);
    } catch (err) {
      console.error('Failed to load subscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        billing_cycle: formData.billing_cycle,
        category_id: formData.category_id || null
      };
      
      if (editingSub) {
        await subscriptionService.update(editingSub.id, data);
      } else {
        await subscriptionService.create(data);
      }
      
      setShowModal(false);
      setEditingSub(null);
      setFormData({ name: '', amount: '', billing_cycle: 'monthly', category_id: '' });
      loadSubscriptions();
      toast.success(editingSub ? 'Subscription updated' : 'Subscription added');
    } catch (err) {
      console.error('Failed to save subscription', err);
      toast.error('Failed to save subscription');
    }
  };

  const handleEdit = (sub) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      amount: sub.amount.toString(),
      billing_cycle: sub.billing_cycle,
      category_id: sub.category_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      try {
        await subscriptionService.delete(id);
        toast.success('Subscription deleted');
      } catch (err) {
        console.error('Failed to delete subscription', err);
        toast.error('Failed to delete subscription. Reverting...');
        loadSubscriptions();
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
          <p className="text-zinc-400 mt-1">Manage your recurring subscriptions</p>
        </div>
        <Button
          onClick={() => {
            setEditingSub(null);
            setFormData({ name: '', amount: '', billing_cycle: 'monthly', category_id: '' });
            setShowModal(true);
          }}
          className="bg-linear-to-r from-violet-600 to-indigo-600"
        >
          <Plus size={18} className="mr-2" />
          Add Subscription
        </Button>
      </div>

      <div className="rounded-2xl border border-white/5 bg-zinc-900/30 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/5 text-zinc-400">
              <tr>
                <th className="h-12 px-6 font-medium">Subscription</th>
                <th className="h-12 px-6 font-medium">Amount</th>
                <th className="h-12 px-6 font-medium">Billing Cycle</th>
                <th className="h-12 px-6 font-medium">Category</th>
                <th className="h-12 px-6 font-medium">Next Billing</th>
                <th className="h-12 px-6 font-medium">Status</th>
                <th className="h-12 px-6 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-zinc-500">Loading subscriptions...</td></tr>
              ) : subscriptions.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-zinc-500">No subscriptions found. Add your first subscription!</td></tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6 font-medium text-white">{sub.name}</td>
                    <td className="p-6 text-white font-bold">${parseFloat(sub.amount).toFixed(2)}</td>
                    <td className="p-6">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        sub.billing_cycle === 'monthly'
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      )}>
                        {sub.billing_cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                      </span>
                    </td>
                    <td className="p-6">
                      {sub.category ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.category.color }} />
                          <span className="text-zinc-300">{sub.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="p-6 text-zinc-400">
                      {sub.next_billing_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-zinc-500" />
                          {new Date(sub.next_billing_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-zinc-500">Not set</span>
                      )}
                    </td>
                    <td className="p-6">
                      {sub.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-white mr-2"
                        onClick={() => handleEdit(sub)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-400"
                        onClick={() => handleDelete(sub.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSub(null);
        }}
        title={editingSub ? 'Edit Subscription' : 'Add Subscription'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Subscription Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Netflix, Spotify"
              required
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Amount</label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Billing Cycle</label>
            <Select
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' }
              ]}
              value={formData.billing_cycle}
              onChange={(value) => setFormData({ ...formData, billing_cycle: value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Category</label>
            <Select
              options={[
                { value: '', label: 'Select category' },
                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
              ]}
              value={formData.category_id}
              onChange={(value) => setFormData({ ...formData, category_id: value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-linear-to-r from-violet-600 to-indigo-600">
              {editingSub ? 'Update' : 'Create'} Subscription
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditingSub(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
