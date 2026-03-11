import { useMemo, useState, useRef } from "react";
import {
  Tag,
  CreditCard,
  Plus,
  Trash2,
  AlertCircle,
  Globe,
  Store,
  Pencil,
  Check,
  X,
  Upload,
  Link,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AppSelect from "../../components/Common/AppSelect";
import {
  useCategories,
  useAddCategory,
  useRemoveCategory,
  useRemoveCategoriesBulk,
  useRenameCategory,
  usePaymentMethods,
  useAddPaymentMethod,
  useRemovePaymentMethod,
  useRemovePaymentMethodsBulk,
  useRenamePaymentMethod,
  useCurrency,
  useUpdateCurrency,
  useCurrencySymbolPosition,
  useUpdateCurrencySymbolPosition,
  useVendors,
  useAddVendor,
  useUpdateVendor,
  useRemoveVendor,
  useUploadVendorLogo,
  useRemoveVendorsBulk,
} from "../../hooks/useApi";
import { useConfirmDialog } from "../../components/Common/ConfirmDialogProvider";
import { SUPPORTED_CURRENCIES } from "../../constants/currencyOptions";
import VendorAvatar from "../../components/Common/VendorAvatar";
import { ListRow } from "../../components/ui/list-row";
import { Button } from "../../components/ui/button";
import { IconButton } from "../../components/ui/icon-button";
import { Checkbox } from "../../components/ui/checkbox";
import { SettingsDataTable } from "../../components/settings/settings-data-table";

const inputCls =
  "flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm";
const inputSmCls =
  "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm";

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export type FamilySetting =
  | "currency"
  | "categories"
  | "payment-methods"
  | "vendors";

function ManagedList({
  icon,
  title,
  description,
  items,
  isLoading,
  onAdd,
  onRemove,
  onRename,
  isPendingAdd,
  isPendingRemove,
  isPendingEdit,
  onRemoveMany,
  pageSize,
  onPageSizeChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: string[];
  isLoading: boolean;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  isPendingAdd: boolean;
  isPendingRemove: boolean;
  isPendingEdit: boolean;
  onRemoveMany?: (names: string[]) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirmDialog();
  const [newItem, setNewItem] = useState("");
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const sortedItems = [...items].sort((a, b) => a.localeCompare(b));
  const filtered = sortedItems.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItem.trim();
    if (!trimmed) {
      setError(t("globalSettings.fieldRequired"));
      return;
    }
    if (items.includes(trimmed)) {
      setError(t("globalSettings.alreadyExists"));
      return;
    }
    setError("");
    onAdd(trimmed);
    setNewItem("");
    setSearch("");
    setPage(1);
  };

  const toggleSelected = (item: string) => {
    setSelectedItems((prev) =>
      prev.includes(item)
        ? prev.filter((value) => value !== item)
        : [...prev, item],
    );
  };

  const handleRemoveOne = async (item: string) => {
    const accepted = await confirm({
      title: t("common.delete"),
      message: t("globalSettings.confirmDeleteItem", { item }),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!accepted) return;
    onRemove(item);
    setSelectedItems((prev) => prev.filter((value) => value !== item));
    if (pageItems.length === 1 && currentPage > 1) setPage(currentPage - 1);
  };

  const handleRemoveSelected = async () => {
    if (!selectedItems.length) return;
    const accepted = await confirm({
      title: t("common.delete"),
      message: t("globalSettings.confirmDeleteSelected", {
        count: selectedItems.length,
      }),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!accepted) return;
    if (onRemoveMany) {
      onRemoveMany(selectedItems);
    } else {
      selectedItems.forEach((item) => onRemove(item));
    }
    setSelectedItems([]);
    setPage(1);
  };

  const startEditing = (item: string) => {
    setEditingItem(item);
    setEditingValue(item);
    setError("");
  };

  const submitEdit = () => {
    if (!editingItem) return;
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setError(t("globalSettings.fieldRequired"));
      return;
    }
    if (trimmed === editingItem) {
      setEditingItem(null);
      return;
    }
    if (items.includes(trimmed)) {
      setError(t("globalSettings.alreadyExists"));
      return;
    }
    onRename(editingItem, trimmed);
    setEditingItem(null);
    setEditingValue("");
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-primary dark:text-primary">{icon}</span>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          <span className="whitespace-nowrap">
            {t("globalSettings.itemsPerPage")}:
          </span>
          <AppSelect
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </AppSelect>
        </label>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
        {description}
      </p>

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
          onChange={(e) => {
            setNewItem(e.target.value);
            setError("");
          }}
          className={inputCls}
          placeholder={t("globalSettings.addPlaceholder", {
            item: title.toLowerCase(),
          })}
        />
        <button
          type="submit"
          disabled={isPendingAdd}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-lg transition-colors"
        >
          {isPendingAdd ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus size={15} />
          )}
          {t("globalSettings.addItem")}
        </button>
      </form>

      {/* Search */}
      {items.length > 0 && (
        <div className="relative mb-3">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("common.search", { defaultValue: "Search…" })}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs mb-3">
          <span className="text-amber-700 dark:text-amber-300">
            {t("globalSettings.selectedCount", { count: selectedItems.length })}
          </span>
          <button
            onClick={handleRemoveSelected}
            disabled={isPendingRemove}
            className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
          >
            <Trash2 size={13} />
            {t("globalSettings.deleteSelected")}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">
          {search
            ? t("common.noResults", { defaultValue: "No results found." })
            : t("globalSettings.noneAdded")}
        </p>
      ) : (
        <SettingsDataTable
          rows={pageItems}
          page={currentPage}
          pageCount={totalPages}
          onPageChange={setPage}
          emptyState={null}
          renderRow={(item) => {
            const checked = selectedItems.includes(item);
            const editing = editingItem === item;

            return (
              <ListRow key={item}>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                    <Checkbox
                      controlSize="md"
                      checked={checked}
                      onChange={() => toggleSelected(item)}
                    />
                    {editing ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="min-w-0 flex-1 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        {item}
                      </span>
                    )}
                  </label>
                  <div className="ml-auto flex items-center gap-2">
                    {editing ? (
                      <>
                        <IconButton
                          onClick={submitEdit}
                          disabled={isPendingEdit}
                          size="md"
                          variant="success"
                          aria-label={t("common.save")}
                        >
                          <Check size={14} />
                        </IconButton>
                        <IconButton
                          onClick={() => setEditingItem(null)}
                          size="md"
                          aria-label={t("common.cancel")}
                        >
                          <X size={14} />
                        </IconButton>
                      </>
                    ) : (
                        <IconButton
                          onClick={() => startEditing(item)}
                        size="md"
                        variant="violet"
                        className="border-violet-500/45 bg-violet-500/20 text-violet-300"
                        aria-label={t("common.edit")}
                      >
                        <Pencil size={14} />
                      </IconButton>
                    )}
                    <IconButton
                      onClick={() => handleRemoveOne(item)}
                      disabled={isPendingRemove}
                      size="md"
                      variant="danger"
                      className="border-red-500/45 bg-red-500/20 text-red-300"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </div>
              </ListRow>
            );
          }}
        />
      )}
    </div>
  );
}

function LogoPicker({
  vendorId,
  currentLogoUrl,
  onUrlSave,
  isPending,
}: {
  vendorId: string;
  currentLogoUrl: string;
  onUrlSave: (url: string) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const uploadVendorLogo = useUploadVendorLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [urlValue, setUrlValue] = useState(currentLogoUrl);
  const [uploadErr, setUploadErr] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr("");
    try {
      await uploadVendorLogo.mutateAsync({ id: vendorId, file });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setUploadErr(
        Array.isArray(msg)
          ? msg.join(", ")
          : msg || t("globalSettings.uploadFailed"),
      );
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 text-xs">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-1 px-2 py-1 rounded ${mode === "url" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <Link size={11} /> {t("globalSettings.viaUrl")}
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1 px-2 py-1 rounded ${mode === "upload" ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <Upload size={11} /> {t("globalSettings.uploadOption")}
        </button>
      </div>

      {mode === "url" ? (
        <div className="flex gap-1.5">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://logo.clearbit.com/example.com"
            className={inputSmCls}
          />
          <button
            type="button"
            onClick={() => onUrlSave(urlValue.trim())}
            disabled={isPending}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 text-white rounded-md transition-colors disabled:opacity-60"
          >
            <Check size={12} />
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadVendorLogo.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {uploadVendorLogo.isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={12} />
            )}
            {t("globalSettings.chooseFile")}
          </button>
          {uploadErr && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              {uploadErr}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function VendorRow({
  vendor,
  checked,
  onToggle,
  onUpdate,
  onRemove,
  isPending,
}: {
  vendor: { id: string; name: string; logoUrl?: string };
  checked: boolean;
  onToggle: () => void;
  onUpdate: (
    id: string,
    data: { name?: string; logoUrl?: string | null },
  ) => void;
  onRemove: (id: string) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirmDialog();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(vendor.name);

  const handleSave = () => {
    onUpdate(vendor.id, { name: name.trim() || vendor.name });
    setEditing(false);
  };

  const handleCancel = () => {
    setName(vendor.name);
    setEditing(false);
  };

  return (
    <ListRow>
      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("users.name")}
            className={inputSmCls}
          />

          <LogoPicker
            vendorId={vendor.id}
            currentLogoUrl={vendor.logoUrl ?? ""}
            onUrlSave={(url) => onUpdate(vendor.id, { logoUrl: url || null })}
            isPending={isPending}
          />

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <X size={13} /> {t("common.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 text-white rounded-md transition-colors disabled:opacity-60"
            >
              <Check size={13} /> {t("globalSettings.saveName")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
            <Checkbox
              controlSize="md"
              checked={checked}
              onChange={onToggle}
            />
            <VendorAvatar
              vendorName={vendor.name}
              logoUrl={vendor.logoUrl}
              show={true}
              size="sm"
            />
            <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
              {vendor.name}
            </span>
          </label>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <IconButton
              onClick={() => setEditing(true)}
              size="md"
              variant="violet"
              className="border-violet-500/45 bg-violet-500/20 text-violet-300"
              aria-label={t("common.edit")}
            >
              <Pencil size={14} />
            </IconButton>
            <IconButton
              onClick={async () => {
                const accepted = await confirm({
                  title: t("common.delete"),
                  message: t("globalSettings.confirmDeleteItem", {
                    item: vendor.name,
                  }),
                  confirmLabel: t("common.delete"),
                  tone: "danger",
                });
                if (accepted) onRemove(vendor.id);
              }}
              disabled={isPending}
              size="md"
              variant="danger"
              className="border-red-500/45 bg-red-500/20 text-red-300"
              aria-label={t("common.delete")}
            >
              <Trash2 size={14} />
            </IconButton>
          </div>
        </div>
      )}
    </ListRow>
  );
}

function VendorManager({
  pageSize,
  onPageSizeChange,
}: {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirmDialog();
  const { data: vendors = [], isLoading } = useVendors();
  const addVendor = useAddVendor();
  const updateVendor = useUpdateVendor();
  const removeVendor = useRemoveVendor();
  const removeVendorsBulk = useRemoveVendorsBulk();

  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const sortedVendors = [...vendors].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const filtered = sortedVendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageVendors = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError(t("globalSettings.fieldRequired"));
      return;
    }
    if (vendors.some((v) => v.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(t("globalSettings.vendorExists"));
      return;
    }
    setError("");
    addVendor.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setNewName("");
          setSearch("");
          setPage(1);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message;
          setError(
            Array.isArray(msg)
              ? msg.join(", ")
              : msg || t("globalSettings.somethingWentWrong"),
          );
        },
      },
    );
  };

  const toggleSelectedVendor = (id: string) => {
    setSelectedVendorIds((prev) =>
      prev.includes(id)
        ? prev.filter((vendorId) => vendorId !== id)
        : [...prev, id],
    );
  };

  const removeSelectedVendors = async () => {
    if (!selectedVendorIds.length) return;
    const accepted = await confirm({
      title: t("common.delete"),
      message: t("globalSettings.confirmDeleteSelected", {
        count: selectedVendorIds.length,
      }),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!accepted) return;
    removeVendorsBulk.mutate(selectedVendorIds, {
      onSuccess: () => {
        setSelectedVendorIds([]);
        setPage(1);
      },
    });
  };

  const pending =
    updateVendor.isPending ||
    removeVendor.isPending ||
    removeVendorsBulk.isPending;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Store size={18} className="text-primary dark:text-primary" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {t("globalSettings.vendors")}
          </h2>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          <span className="whitespace-nowrap">
            {t("globalSettings.itemsPerPage")}:
          </span>
          <AppSelect
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </AppSelect>
        </label>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
        {t("globalSettings.vendorsDesc")}
      </p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-3 py-2 text-sm mb-3">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            setError("");
          }}
          className={inputCls}
          placeholder={t("globalSettings.vendorNamePlaceholder")}
        />
        <button
          type="submit"
          disabled={addVendor.isPending}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-lg transition-colors whitespace-nowrap"
        >
          {addVendor.isPending ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus size={15} />
          )}
          {t("globalSettings.addItem")}
        </button>
      </form>

      {/* Search */}
      {vendors.length > 0 && (
        <div className="relative mb-3">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("common.search", { defaultValue: "Search…" })}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
      )}

      {selectedVendorIds.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs mb-3">
          <span className="text-amber-700 dark:text-amber-300">
            {t("globalSettings.selectedCount", {
              count: selectedVendorIds.length,
            })}
          </span>
          <button
            onClick={removeSelectedVendors}
            disabled={pending}
            className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
          >
            <Trash2 size={13} />
            {t("globalSettings.deleteSelected")}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">
          {search
            ? t("common.noResults", { defaultValue: "No results found." })
            : t("globalSettings.noVendors")}
        </p>
      ) : (
        <SettingsDataTable
          rows={pageVendors}
          page={currentPage}
          pageCount={totalPages}
          onPageChange={setPage}
          emptyState={null}
          renderRow={(vendor) => (
            <VendorRow
              key={vendor.id}
              vendor={vendor}
              checked={selectedVendorIds.includes(vendor.id)}
              onToggle={() => toggleSelectedVendor(vendor.id)}
              onUpdate={(id, data) => updateVendor.mutate({ id, data })}
              onRemove={(id) => removeVendor.mutate(id)}
              isPending={pending}
            />
          )}
        />
      )}
    </div>
  );
}

function CurrencySettings() {
  const { t } = useTranslation();
  const { data: currentCurrency = "NOK", isLoading: loadingCurrency } =
    useCurrency();
  const { data: currentPosition = "Before", isLoading: loadingPosition } =
    useCurrencySymbolPosition();
  const updateCurrency = useUpdateCurrency();
  const updatePosition = useUpdateCurrencySymbolPosition();
  const [selected, setSelected] = useState<string>("");
  const [successCurrency, setSuccessCurrency] = useState(false);
  const [successPosition, setSuccessPosition] = useState(false);

  const value = selected || currentCurrency;

  const handleSaveCurrency = () => {
    setSuccessCurrency(false);
    updateCurrency.mutate(value, { onSuccess: () => setSuccessCurrency(true) });
  };

  const handleSavePosition = (pos: string) => {
    setSuccessPosition(false);
    updatePosition.mutate(pos as "Before" | "After", {
      onSuccess: () => setSuccessPosition(true),
    });
  };

  const isLoading = loadingCurrency || loadingPosition;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Globe size={18} className="text-primary dark:text-primary" />
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          {t("globalSettings.currency")}
        </h2>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
        {t("globalSettings.currencyDesc")}
      </p>

      {successCurrency && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-3 py-2 text-sm mb-4">
          {t("globalSettings.currencyUpdated", { value })}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Currency selector */}
          <div className="flex gap-2">
            <AppSelect
              value={value}
              onChange={(e) => {
                setSelected(e.target.value);
                setSuccessCurrency(false);
              }}
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </AppSelect>
            <button
              onClick={handleSaveCurrency}
              disabled={updateCurrency.isPending || value === currentCurrency}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-lg transition-colors"
            >
              {updateCurrency.isPending && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {t("common.save")}
            </button>
          </div>

          {/* Currency position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("globalSettings.currencyPosition")}
            </label>
            {successPosition && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-3 py-2 text-sm mb-2">
                {t("globalSettings.currencySymbolPositionUpdated")}
              </div>
            )}
            <AppSelect
              value={currentPosition}
              onChange={(e) => handleSavePosition(e.target.value)}
              disabled={updatePosition.isPending}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm disabled:opacity-60"
            >
              <option value="Before">{t("globalSettings.symbolBefore")}</option>
              <option value="After">{t("globalSettings.symbolAfter")}</option>
            </AppSelect>
          </div>
        </div>
      )}
    </div>
  );
}

export function FamilySettingsContent({
  activeSection,
  pageSize,
  onPageSizeChange,
}: {
  activeSection: FamilySetting;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}) {
  const { t } = useTranslation();
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const { data: paymentMethods = [], isLoading: loadingMethods } =
    usePaymentMethods();
  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      ),
    [categories],
  );
  const addCategory = useAddCategory();
  const removeCategory = useRemoveCategory();
  const removeCategoriesBulk = useRemoveCategoriesBulk();
  const renameCategory = useRenameCategory();
  const addPaymentMethod = useAddPaymentMethod();
  const removePaymentMethod = useRemovePaymentMethod();
  const removePaymentMethodsBulk = useRemovePaymentMethodsBulk();
  const renamePaymentMethod = useRenamePaymentMethod();

  if (activeSection === "currency") return <CurrencySettings />;

  if (activeSection === "categories")
    return (
      <ManagedList
        icon={<Tag size={18} />}
        title={t("globalSettings.categories")}
        description={t("globalSettings.categoriesDesc")}
        items={sortedCategories}
        isLoading={loadingCats}
        onAdd={(name) => addCategory.mutate(name)}
        onRemove={(name) => removeCategory.mutate(name)}
        onRename={(oldName, newName) =>
          renameCategory.mutate({ oldName, newName })
        }
        isPendingAdd={addCategory.isPending}
        isPendingRemove={
          removeCategory.isPending || removeCategoriesBulk.isPending
        }
        isPendingEdit={renameCategory.isPending}
        onRemoveMany={(names) => removeCategoriesBulk.mutate(names)}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
      />
    );

  if (activeSection === "payment-methods")
    return (
      <ManagedList
        icon={<CreditCard size={18} />}
        title={t("globalSettings.paymentMethods")}
        description={t("globalSettings.paymentMethodsDesc")}
        items={paymentMethods}
        isLoading={loadingMethods}
        onAdd={(name) => addPaymentMethod.mutate(name)}
        onRemove={(name) => removePaymentMethod.mutate(name)}
        onRename={(oldName, newName) =>
          renamePaymentMethod.mutate({ oldName, newName })
        }
        isPendingAdd={addPaymentMethod.isPending}
        isPendingRemove={
          removePaymentMethod.isPending || removePaymentMethodsBulk.isPending
        }
        isPendingEdit={renamePaymentMethod.isPending}
        onRemoveMany={(names) => removePaymentMethodsBulk.mutate(names)}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
      />
    );

  if (activeSection === "vendors")
    return (
      <VendorManager pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
    );

  return null;
}

export default function FamilySettings() {
  const { t } = useTranslation();

  const [activeSection, setActiveSection] = useState<FamilySetting>("currency");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const navItems: {
    key: FamilySetting;
    label: string;
    icon: React.ElementType;
  }[] = [
    { key: "currency", label: t("globalSettings.currency"), icon: Globe },
    { key: "categories", label: t("globalSettings.categories"), icon: Tag },
    {
      key: "payment-methods",
      label: t("globalSettings.paymentMethods"),
      icon: CreditCard,
    },
    { key: "vendors", label: t("globalSettings.vendors"), icon: Store },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t("globalSettings.title")}
      </h1>

      {/* Mobile: dropdown selector */}
      <div className="xl:hidden">
        <AppSelect
          value={activeSection}
          onChange={(e) => setActiveSection(e.target.value as FamilySetting)}
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          {navItems.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </AppSelect>
      </div>

      <div className="flex gap-6 items-start">
        {/* Desktop: left sidebar */}
        <nav className="hidden xl:flex flex-col w-52 flex-shrink-0 gap-0.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-2 shadow-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                  isActive
                    ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right content panel */}
        <div className="flex-1 min-w-0">
          <FamilySettingsContent
            activeSection={activeSection}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>
    </div>
  );
}
