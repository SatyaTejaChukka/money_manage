import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { Select } from '../ui/Select.jsx';
import { Search, Filter, Trash2, ArrowRight, Edit, CheckCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { transactionService } from '../../services/transactions.js';
import { Modal } from '../ui/Modal.jsx';
import { TransactionForm } from './TransactionForm.jsx';

export function TransactionTable({ refreshTrigger }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(search);
        setPage(1); // Reset page on search change
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
      setPage(1);
  }, [typeFilter, statusFilter]);

  // Fetch data
  const loadTransactions = async () => {
    setLoading(true);
    try {
        const params = {
            skip: (page - 1) * 10,
            limit: 10,
            ...(debouncedSearch && { search: debouncedSearch }),
            ...(typeFilter !== 'all' && { type: typeFilter.toUpperCase() }),
            ...(statusFilter !== 'all' && { status: statusFilter })
        };
        const res = await transactionService.getAll(params);
        if (res.length < 10) setHasMore(false);
        else setHasMore(true);
        setData(res);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [page, refreshTrigger, debouncedSearch, typeFilter, statusFilter]);

  const [editingTransaction, setEditingTransaction] = useState(null);

  const handleUpdate = async (data) => {
      try {
          await transactionService.update(editingTransaction.id, data);
          setEditingTransaction(null);
          loadTransactions();
      } catch (err) {
          console.error("Failed to update transaction", err);
          alert("Failed to update transaction");
      }
  };

  const handleDelete = async (id) => {
      if(confirm('Are you sure you want to delete this transaction?')) {
          await transactionService.delete(id);
          loadTransactions();
      }
  };

  const handleMarkAsPaid = async (id, e) => {
    e.stopPropagation();
    try {
      await transactionService.complete(id);
      loadTransactions();
    } catch (err) {
      console.error("Failed to mark as paid", err);
      alert("Failed to mark transaction as paid");
    }
  };

  const [viewingTransaction, setViewingTransaction] = useState(null);

  return (
    <div className="space-y-4">
       {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <Input 
                placeholder="Search description..." 
                className="pl-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 sm:w-40">
              <Select 
                  options={[
                      { value: 'all', label: 'All Types' },
                      { value: 'income', label: 'Income' },
                      { value: 'expense', label: 'Expense' }
                  ]}
                  value={typeFilter}
                  onChange={setTypeFilter}
              />
            </div>
            <div className="flex-1 sm:w-40">
              <Select 
                  options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'completed', label: 'Completed' }
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
              />
            </div>
          </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading transactions...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No transactions found.</div>
        ) : (
          data.map((t) => (
            <div 
              key={t.id}
              className="rounded-xl border border-white/5 bg-zinc-900/30 p-4 backdrop-blur-md space-y-3 cursor-pointer active:bg-white/5 transition-colors"
              onClick={() => setViewingTransaction(t)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{t.description || "Untitled Transaction"}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{new Date(t.occurred_at).toLocaleDateString()}</p>
                </div>
                <span className={cn(
                  "text-base font-bold whitespace-nowrap",
                  t.type === 'INCOME' ? "text-emerald-400" : "text-white"
                )}>
                  {t.type === 'INCOME' ? '+' : ''}${parseFloat(t.amount).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                  t.type === 'INCOME'
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                )}>
                  {t.type}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                  t.status === 'pending'
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                )}>
                  {t.status === 'pending' ? <Clock size={10} /> : <CheckCircle size={10} />}
                  {t.status === 'pending' ? 'Pending' : 'Completed'}
                </span>
                {t.category && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.category.color || '#71717a' }} />
                    {t.category.name}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-white/5 justify-end">
                {t.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-emerald-400 hover:bg-emerald-500/10"
                    onClick={(e) => handleMarkAsPaid(t.id, e)}
                  >
                    <CheckCircle size={12} className="mr-1" /> Paid
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); setEditingTransaction(t); }}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-red-400"
                  onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border border-white/5 bg-zinc-900/30 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/5 text-zinc-400">
              <tr>
                <th className="h-12 px-6 font-medium">Date</th>
                <th className="h-12 px-6 font-medium">Description</th>
                <th className="h-12 px-6 font-medium">Status</th>
                <th className="h-12 px-6 font-medium">Type</th>
                <th className="h-12 px-6 font-medium text-right">Amount</th>
                <th className="h-12 px-6 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-zinc-500">Loading transactions...</td></tr>
              ) : data.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-zinc-500">No transactions found.</td></tr>
              ) : (
                data.map((t) => (
                    <tr 
                        key={t.id} 
                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                        onClick={() => setViewingTransaction(t)}
                    >
                    <td className="p-6 text-zinc-300">
                        {new Date(t.occurred_at).toLocaleDateString()}
                    </td>
                    <td className="p-6 font-medium text-white">
                        <div>{t.description || "Untitled Transaction"}</div>
                        {t.category && (
                            <div className="text-xs text-zinc-500 mt-1 font-normal flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.category.color || '#71717a' }}></span>
                                {t.category.name}
                            </div>
                        )}
                    </td>
                    <td className="p-6">
                        <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            t.status === 'pending'
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}>
                        {t.status === 'pending' ? <Clock size={12} /> : <CheckCircle size={12} />}
                        {t.status === 'pending' ? 'Pending' : 'Completed'}
                        </span>
                    </td>
                    <td className="p-6">
                        <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            t.type === 'INCOME' 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        )}>
                        {t.type}
                        </span>
                    </td>
                    <td className={cn(
                        "p-6 text-right font-bold",
                        t.type === 'INCOME' ? "text-emerald-400" : "text-white"
                    )}>
                        {t.type === 'INCOME' ? '+' : ''}${parseFloat(t.amount).toFixed(2)}
                    </td>
                    <td className="p-6 text-right whitespace-nowrap">
                        {t.status === 'pending' && (
                          <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 mr-2"
                              onClick={(e) => handleMarkAsPaid(t.id, e)}
                          >
                            <CheckCircle size={14} className="mr-1" />
                            Mark Paid
                          </Button>
                        )}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-500 hover:text-white mr-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingTransaction(t);
                            }}
                        >
                        <Edit size={16} />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-500 hover:text-red-400"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(t.id);
                            }}
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
      

      
      <div className="flex justify-between items-center px-2">
         <span className="text-xs text-zinc-500">Page {page}</span>
         <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Prev</Button>
             <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)} disabled={!hasMore && data.length < 10}>Next</Button>
         </div>
      </div>

       <Modal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          title="Edit Transaction"
       >
         {editingTransaction && (
             <TransactionForm 
                initialData={editingTransaction}
                onSubmit={handleUpdate}
                onCancel={() => setEditingTransaction(null)}
             />
         )}
       </Modal>
       
       {/* Preview Modal */}
       <Modal
          isOpen={!!viewingTransaction}
          onClose={() => setViewingTransaction(null)}
          title="Transaction Details"
       >
           {viewingTransaction && (
               <div className="space-y-6">
                   <div className="flex justify-between items-start">
                       <div>
                           <h3 className="text-xl font-bold text-white">{viewingTransaction.description}</h3>
                           <p className="text-zinc-400 text-sm">
                               {new Date(viewingTransaction.occurred_at).toLocaleString()}
                           </p>
                       </div>
                       <div className={cn(
                           "px-3 py-1 rounded-full text-xs font-bold border",
                            viewingTransaction.type === 'INCOME' 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                       )}>
                           {viewingTransaction.type}
                       </div>
                   </div>

                   <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 flex flex-col items-center">
                       <span className="text-zinc-500 text-sm mb-1">Amount</span>
                       <span className={cn(
                           "text-4xl font-bold",
                           viewingTransaction.type === 'INCOME' ? "text-emerald-400" : "text-white"
                       )}>
                           ${parseFloat(viewingTransaction.amount).toFixed(2)}
                       </span>
                   </div>

                   {viewingTransaction.category && (
                       <div className="flex items-center gap-3 p-4 bg-zinc-900/30 rounded-lg border border-white/5">
                           <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                                style={{ backgroundColor: viewingTransaction.category.color }}
                           >
                               {viewingTransaction.category.name[0]}
                           </div>
                           <div>
                               <p className="text-xs text-zinc-500 uppercase tracking-wider">Category</p>
                               <p className="font-medium text-white">{viewingTransaction.category.name}</p>
                           </div>
                       </div>
                   )}

                   <div className="flex gap-3 pt-4">
                       <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                                setEditingTransaction(viewingTransaction);
                                setViewingTransaction(null);
                            }}
                       >
                           <Edit size={16} className="mr-2" /> Edit
                       </Button>
                       <Button 
                            variant="ghost" 
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => {
                                handleDelete(viewingTransaction.id);
                                setViewingTransaction(null);
                            }}
                       >
                           <Trash2 size={16} className="mr-2" /> Delete
                       </Button>
                   </div>
               </div>
           )}
       </Modal>
    </div>
  );
}
