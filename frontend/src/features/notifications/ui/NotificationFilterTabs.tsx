import { Tabs } from '@/shared/ui/Tabs'

export const NotificationFilterTabs = ({
  value,
  onChange,
}: {
  value: 'all' | 'unread'
  onChange: (value: 'all' | 'unread') => void
}) => (
  <Tabs
    items={[
      { key: 'all', label: 'All' },
      { key: 'unread', label: 'Unread' },
    ]}
    onChange={onChange}
    value={value}
    ariaLabel="Notification filters"
  />
)
