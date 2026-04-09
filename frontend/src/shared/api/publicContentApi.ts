import type { AxiosInstance } from 'axios'
import type {
  Destination,
  DestinationQueryParams,
} from '@/features/destinations/model/destination.types'
import type {
  Promotion,
  PromotionQueryParams,
} from '@/features/promotions/model/promotion.types'
import type { FaqItem, HelpTopic } from '@/features/support/model/support.types'

export function createPublicContentApi(client: AxiosInstance) {
  return {
    async getDestinations(params: DestinationQueryParams = {}): Promise<Destination[]> {
      const response = await client.get('/content/destinations', {
        params: {
          query: params.query,
          region: params.region,
          featured_only: params.featuredOnly,
          limit: params.limit,
        },
      })
      return response.data
    },

    async getPromotions(params: PromotionQueryParams = {}): Promise<Promotion[]> {
      const response = await client.get('/content/promotions', {
        params: {
          category: params.category,
          status: params.status,
          featured_only: params.featuredOnly,
          limit: params.limit,
        },
      })
      return response.data
    },

    async getSupportFaqs(): Promise<FaqItem[]> {
      const response = await client.get('/content/support/faqs')
      return response.data
    },

    async getSupportHelpTopics(): Promise<HelpTopic[]> {
      const response = await client.get('/content/support/help-topics')
      return response.data
    },
  }
}
