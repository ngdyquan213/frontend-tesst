import { Input } from '@/shared/ui/Input'

interface SearchBarProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export const SearchBar = ({ placeholder, value, onChange }: SearchBarProps) => (
  <div className="relative">
    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
    <Input className="pl-12" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
  </div>
)

