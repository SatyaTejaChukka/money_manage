import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { budgetService } from '../../services/budgets.js';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.jsx';
import { BudgetRuleForm } from '../../components/budget/BudgetRuleForm.jsx';
import { cn } from '../../lib/utils';
import { useToast } from '../../components/ui/Toast.jsx';


export default function Budget() {
  const [summary, setSummary] = useState(null);
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const toast = useToast();

  useEffect(() => {
      const fetchData = async () => {
          setIsLoading(true);
          try {
              const ruleData = await budgetService.getRules();
              setRules(ruleData);
              // Summary requires month/year, default to current
              const now = new Date();
              const sumData = await budgetService.getSummary(now.getMonth() + 1, now.getFullYear());
              setSummary(sumData);
          } catch (err) {
              console.error(err);
          } finally {
              setIsLoading(false);
          }
      };
      fetchData();
  }, [refreshTrigger]);

  const handleDeleteRule = async (id) => {
      if(confirm('Delete this budget rule?')) {
          setRules((prev) => prev.filter((r) => r.id !== id));
          try {
              await budgetService.deleteRule(id);
              toast.success('Budget rule deleted');
          } catch (err) {
              console.error('Failed to delete rule', err);
              toast.error('Failed to delete rule');
              setRefreshTrigger(p => p+1);
          }
      }
  };

  const handleCreateRule = async (data) => {
      try {
          await budgetService.createRule(data);
          setIsModalOpen(false);
          setRefreshTrigger(p => p+1);
          toast.success('Budget rule created');
      } catch (err) {
        toast.error('Failed to create rule. Check category ID.');
      }
  };

  if (isLoading) {
       return (
        <div className="flex items-center justify-center h-[50vh]">
             <div className="flex items-center gap-3 text-zinc-400">
                <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-violet-600 animate-spin" />
                <span className="text-sm font-medium">Loading Budget...</span>
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-8 animate-slide-up">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Budget & Planning</h1>
          <p className="text-zinc-400 mt-1">Manage your spending limits and automations.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/20 text-sm flex items-center gap-2"
        >
          <Plus size={18} />
          Add Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="grid gap-6">
          {rules.length === 0 ? (
              <Card className="bg-zinc-900/40 border-dashed border-zinc-800 p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4 text-zinc-500">
                      <AlertCircle size={24} />
                  </div>
                  <h3 className="text-white font-medium mb-1">No Budget Rules Set</h3>
                  <p className="text-zinc-500 text-sm max-w-md mx-auto">
                      Create rules to automatically allocate your income to different categories or savings goals.
                  </p>
              </Card>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rules.map(rule => (
                      <Card key={rule.id} className="relative group overflow-hidden bg-zinc-900/40 border-white/5 hover:border-violet-500/20 transition-all">
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                             <CardTitle className="text-base">
                                 {rule.category ? rule.category.name : 'Uncategorized'}
                             </CardTitle>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteRule(rule.id)}>
                                 <Trash2 size={16} />
                             </Button>
                          </CardHeader>
                          <CardContent>
                              <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold text-white">
                                      {rule.allocation_type === 'PERCENT' ? `${rule.allocation_value}%` : `$${rule.allocation_value}`}
                                  </span>
                                  <span className="text-xs text-zinc-500 font-medium">ALLOCATED</span>
                              </div>
                              {rule.monthly_limit && (
                                  <p className="text-xs text-zinc-500 mt-2">
                                      Limit: <span className="text-zinc-300">${rule.monthly_limit}</span>
                                  </p>
                              )}
                          </CardContent>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Card>
                  ))}
              </div>
          )}
      </div>

      <Modal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)}
         title="Create Budget Rule"
       >
           <BudgetRuleForm 
             onSubmit={handleCreateRule} 
             onCancel={() => setIsModalOpen(false)} 
           />
       </Modal>
    </div>
  );
}
