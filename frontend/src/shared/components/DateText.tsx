import { formatDate } from '@/shared/lib/formatDate'

export const DateText = ({ value }: { value: string }) => <>{formatDate(value)}</>

