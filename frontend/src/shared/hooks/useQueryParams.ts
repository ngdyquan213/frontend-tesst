import { useSearchParams } from 'react-router-dom'

export const useQueryParams = () => {
  const [params, setParams] = useSearchParams()
  return {
    params,
    setParam: (key: string, value: string) => {
      const next = new URLSearchParams(params)
      next.set(key, value)
      setParams(next)
    },
  }
}

