import { formatCurrency } from '@/shared/lib/formatCurrency'

export const CurrencyText = ({ value }: { value: number }) => <>{formatCurrency(value)}</>

