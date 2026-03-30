import { DocumentList } from '@/features/documents/ui/DocumentList'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const DocumentOverviewSection = () => (
  <section>
    <SectionHeader title="Documents" />
    <DocumentList />
  </section>
)

