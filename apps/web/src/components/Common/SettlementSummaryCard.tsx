type SettlementSummaryCardProps = {
  direction: string;
  amount: string;
  remainingLabel: string;
  baseShareLabel: string;
  baseShareValue: string;
  carriedCreditLabel: string;
  carriedCreditValue: string;
  paymentsLabel: string;
  paymentsValue: string;
};

export default function SettlementSummaryCard({
  direction,
  amount,
  remainingLabel,
  baseShareLabel,
  baseShareValue,
  carriedCreditLabel,
  carriedCreditValue,
  paymentsLabel,
  paymentsValue,
}: SettlementSummaryCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <div className="font-semibold text-gray-900 dark:text-gray-100">
        {direction}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {amount}
      </div>
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {remainingLabel}
      </div>
      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
        <div>
          {baseShareLabel}: {baseShareValue}
        </div>
        <div>
          {carriedCreditLabel}: {carriedCreditValue}
        </div>
        <div>
          {paymentsLabel}: {paymentsValue}
        </div>
      </div>
    </div>
  );
}
