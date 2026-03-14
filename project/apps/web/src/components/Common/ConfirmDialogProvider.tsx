import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import AppDialog from "./AppDialog";
import AppButton from "./AppButton";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (message: string, title?: string) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface DialogState extends ConfirmOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
  mode: "confirm" | "notify";
}

const initialState: DialogState = {
  open: false,
  message: "",
  mode: "confirm",
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(initialState);

  const closeDialog = useCallback((result: boolean) => {
    setState((current) => {
      current.resolve?.(result);
      return initialState;
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, open: true, resolve, mode: "confirm" });
    });
  }, []);

  const notify = useCallback((message: string, title?: string) => {
    return new Promise<void>((resolve) => {
      setState({
        message,
        title,
        open: true,
        resolve: () => resolve(),
        mode: "notify",
        confirmLabel: "OK",
      });
    });
  }, []);

  const value = useMemo(() => ({ confirm, notify }), [confirm, notify]);

  const destructiveByLabel = /\b(slett|delete)\b/i.test(
    `${state.confirmLabel ?? ""} ${state.title ?? ""} ${state.message}`,
  );
  const isDestructive = state.tone === "danger" || destructiveByLabel;

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AppDialog
        open={state.open}
        onClose={() => closeDialog(false)}
        title={state.title ?? "Bekreft handling"}
        description={<p>{state.message}</p>}
        size="sm"
        footer={
          <>
            {state.mode === "confirm" && (
              <AppButton
                onClick={() => closeDialog(false)}
                variant="neutral"
                tone="outline"
              >
                {state.cancelLabel ?? "Avbryt"}
              </AppButton>
            )}
            <AppButton
              onClick={() => closeDialog(true)}
              variant={isDestructive ? "danger" : "primary"}
            >
              {state.confirmLabel ?? "Bekreft"}
            </AppButton>
          </>
        }
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error(
      "useConfirmDialog must be used within ConfirmDialogProvider",
    );
  }
  return context;
}
