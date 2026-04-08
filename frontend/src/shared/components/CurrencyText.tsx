import { formatCurrency } from '@/shared/lib/formatCurrency'

export const CurrencyText = ({
  value,
  currency,
}: {
  value: number
  currency?: string
}) => <>{formatCurrency(value, currency)}</>
