import React, { useState } from 'react';
import { TransactionTable } from '../../components/transactions/TransactionTable.jsx';
import { TransactionForm } from '../../components/transactions/TransactionForm.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Plus } from 'lucide-react';
import { transactionService } from '../../services/transactions.js';

export default function Transactions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateTransaction = async (data) => {
      try {
          await transactionService.create(data);
          setIsModalOpen(false);
          setRefreshTrigger(p => p + 1); // Refresh table
      } catch (err) {
          console.error("Failed to create transaction", err);
          alert("Failed to create transaction");
      }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-zinc-400 mt-1">Manage and view your transaction history.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/20 text-sm flex items-center gap-2"
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </div>

      {/* Main Content */}
       <TransactionTable refreshTrigger={refreshTrigger} />

       <Modal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)}
         title="Add New Transaction"
       >
           <TransactionForm 
             onSubmit={handleCreateTransaction} 
             onCancel={() => setIsModalOpen(false)} 
           />
       </Modal>
    </div>
  );
}
