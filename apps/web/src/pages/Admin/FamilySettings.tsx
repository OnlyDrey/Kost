import { useState } from 'react';
import { Tag, CreditCard, Plus, Trash2, AlertCircle, Globe, Store, Pencil, Check, X } from 'lucide-react';
import {
  useCategories, useAddCategory, useRemoveCategory,
  usePaymentMethods, useAddPaymentMethod, useRemovePaymentMethod,
  useCurrency, useUpdateCurrency,
  useVendors, useAddVendor, useUpdateVendor, useRemoveVendor,
} from '../../hooks/useApi';

const inputCls =
  'flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';
const inputSmCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';

const SUPPORTED_CURRENCIES = [
  { code: 'NOK', label: 'Norwegian Krone (NOK)' },
  { code: 'SEK', label: 'Swedish Krona (SEK)' },
  { code: 'DKK', label: 'Danish Krone (DKK)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
];

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

function VendorRow({
  vendor,
  onUpdate,
  onRemove,
  isPending,
}: {
  vendor: { id: string; name: string; logoUrl?: string };
  onUpdate: (id: string, data: { name?: string; logoUrl?: string | null }) => void;
  onRemove: (id: string) => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(vendor.name);
  const [logoUrl, setLogoUrl] = useState(vendor.logoUrl ?? '');

  const handleSave = () => {
    onUpdate(vendor.id, {
      name: name.trim() || vendor.name,
      logoUrl: logoUrl.trim() || null,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setName(vendor.name);
    setLogoUrl(vendor.logoUrl ?? '');
    setEditing(false);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5">
      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Navn"
            className={inputSmCls}
          />
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Logo URL (valgfri)"
            className={inputSmCls}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <X size={13} /> Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-60"
            >
              <Check size={13} /> Lagre
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {vendor.logoUrl ? (
              <img
                src={vendor.logoUrl}
                alt={vendor.name}
                className="w-6 h-6 rounded object-contain bg-white border border-gray-200 dark:border-gray-600 flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                <Store size={12} className="text-gray-500" />
              </div>
            )}
            <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{vendor.name}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              onClick={() => setEditing(true)}
              className="p-1 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onRemove(vendor.id)}
              disabled={isPending}
              className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VendorManager() {
  const { data: vendors = [], isLoading } = useVendors();
  const addVendor = useAddVendor();
  const updateVendor = useUpdateVendor();
  const removeVendor = useRemoveVendor();

  const [newName, setNewName] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) { setError('Navn er påkrevd'); return; }
    if (vendors.some(v => v.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Leverandør finnes allerede');
      return;
    }
    setError('');
    addVendor.mutate({ name: trimmed, logoUrl: newLogoUrl.trim() || undefined }, {
      onSuccess: () => {
        setNewName('');
        setNewLogoUrl('');
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Noe gikk galt');
      },
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Store size={18} className="text-indigo-600 dark:text-indigo-400" />
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Leverandører</h2>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
        Administrer leverandører som vises i rullegardinmenyen ved opprettelse av utgifter. Legg til logo-URL for å vise ikon.
      </p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-3 py-2 text-sm mb-3">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleAdd} className="space-y-2 mb-5">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(''); }}
            className={inputCls}
            placeholder="Leverandørnavn..."
          />
          <button
            type="submit"
            disabled={addVendor.isPending}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            {addVendor.isPending
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Plus size={15} />
            }
            Legg til
          </button>
        </div>
        <input
          type="url"
          value={newLogoUrl}
          onChange={(e) => setNewLogoUrl(e.target.value)}
          className={inputSmCls}
          placeholder="Logo URL (valgfri, f.eks. https://logo.clearbit.com/example.com)"
        />
      </form>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vendors.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">Ingen leverandører lagt til ennå</p>
      ) : (
        <div className="space-y-1.5">
          {vendors.map((vendor) => (
            <VendorRow
              key={vendor.id}
              vendor={vendor}
              onUpdate={(id, data) => updateVendor.mutate({ id, data })}
              onRemove={(id) => removeVendor.mutate(id)}
              isPending={updateVendor.isPending || removeVendor.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CurrencySettings() {
  const { data: currentCurrency = 'NOK', isLoading } = useCurrency();
  const updateCurrency = useUpdateCurrency();
  const [selected, setSelected] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Use fetched value as default once loaded
  const value = selected || currentCurrency;

  const handleSave = () => {
    setSuccess(false);
    updateCurrency.mutate(value, {
      onSuccess: () => setSuccess(true),
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Globe size={18} className="text-indigo-600 dark:text-indigo-400" />
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Valuta</h2>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
        Velg familiens standardvaluta. Brukes i alle beløpsvisninger og beregninger.
      </p>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-3 py-2 text-sm mb-4">
          Valuta oppdatert til {value}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={(e) => { setSelected(e.target.value); setSuccess(false); }}
            className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={updateCurrency.isPending || value === currentCurrency}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors"
          >
            {updateCurrency.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Lagre
          </button>
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

      <CurrencySettings />

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

      <VendorManager />
    </div>
  );
}
