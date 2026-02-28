interface TagPillProps {
  label: string;
  variant?: 'type' | 'category' | 'frequency' | 'danger' | 'success';
  shape?: 'pill' | 'rounded';
  size?: 'sm' | 'md';
}

const variantClass: Record<NonNullable<TagPillProps['variant']>, string> = {
  type: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  category: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  frequency: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

export default function TagPill({
  label,
  variant = 'category',
  shape = 'pill',
  size = 'sm',
}: TagPillProps) {
  const shapeClass = {
    pill: 'rounded-full',
    rounded: 'rounded-lg',
  };

  const sizeClass = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-2 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium leading-none ${shapeClass[shape]} ${sizeClass[size]} ${variantClass[variant]}`}
    >
      {label}
    </span>
  );
}
