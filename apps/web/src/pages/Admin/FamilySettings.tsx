import { useState } from 'react';
import { Tag, CreditCard, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useCategories, useAddCategory, useRemoveCategory, usePaymentMethods, useAddPaymentMethod, useRemovePaymentMethod } from '../../hooks/useApi';

const inputCls =
  'flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';

function ManagedList({
  icon,
  title,
  description,
  items,
  isLoading,
  onAdd,
  onRemove,
  isPendingAdd,
  isPendingRemove,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: string[];
  isLoading: boolean;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  isPendingAdd: boolean;
  isPendingRemove: boolean;
}) {
  const [newItem, setNewItem] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItem.trim();
    if (!trimmed) { setError('Feltet kan ikke være tomt'); return; }
    if (items.includes(trimmed)) { setError('Finnes allerede'); return; }
    setError('');
    onAdd(trimmed);
    setNewItem('');
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">{description}</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-3 py-2 text-sm mb-3">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={(e) => { setNewItem(e.target.value); setError(''); }}
          className={inputCls}
          placeholder={`Legg til ${title.toLowerCase()}...`}
        />
        <button
          type="submit"
          disabled={isPendingAdd}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors"
        >
          {isPendingAdd
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Plus size={15} />
          }
          Legg til
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">Ingen lagt til ennå</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-900 dark:text-gray-100">{item}</span>
              <button
                onClick={() => onRemove(item)}
                disabled={isPendingRemove}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FamilySettings() {
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const { data: paymentMethods = [], isLoading: loadingMethods } = usePaymentMethods();
  const addCategory = useAddCategory();
  const removeCategory = useRemoveCategory();
  const addPaymentMethod = useAddPaymentMethod();
  const removePaymentMethod = useRemovePaymentMethod();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Familieinnstillinger</h1>

      <ManagedList
        icon={<Tag size={18} />}
        title="Kategorier"
        description="Kategorier brukes til å gruppere utgifter. Velges fra rullegardin når du oppretter en utgift."
        items={categories}
        isLoading={loadingCats}
        onAdd={(name) => addCategory.mutate(name)}
        onRemove={(name) => removeCategory.mutate(name)}
        isPendingAdd={addCategory.isPending}
        isPendingRemove={removeCategory.isPending}
      />

      <ManagedList
        icon={<CreditCard size={18} />}
        title="Betalingsmåter"
        description="Betalingsmåter brukes til å angi hvordan en betaling ble gjennomført. Velges fra rullegardin ved registrering av betaling."
        items={paymentMethods}
        isLoading={loadingMethods}
        onAdd={(name) => addPaymentMethod.mutate(name)}
        onRemove={(name) => removePaymentMethod.mutate(name)}
        isPendingAdd={addPaymentMethod.isPending}
        isPendingRemove={removePaymentMethod.isPending}
      />
    </div>
  );
}
