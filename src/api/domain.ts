import { fetcher, FetcherMethod, swrFetcher } from './api' // 导入正确的 fetcher 函数和方法枚举
import type { Domain, BillingDataMod} from '@/types/api'

// --- GET 请求 (用于 SWR) ---

// 获取域名列表的函数，专门为 useSWR 设计
// swrFetcher 内部会调用 fetcher，这一部分是正确的
export const useDomainList = () => {
  return swrFetcher<Domain[]>('/api/v1/domains')
}


// --- POST, PUT, DELETE 请求 (使用 fetcher) ---

// 添加一个新的域名
export const addDomain = (domain: string) => {
  return fetcher<Domain>(FetcherMethod.POST, '/api/v1/domains', { domain })
}

// 触发域名验证
export const verifyDomain = (id: number) => {
  return fetcher<{ success: boolean; message: string }>(FetcherMethod.POST, `/api/v1/domains/${id}/verify`)
}

// 更新域名的配置信息
export const updateDomainConfig = (id: number, billingData: BillingDataMod) => {
    return fetcher<Domain>(FetcherMethod.PUT, `/api/v1/domains/${id}`, { billing_data: billingData })
}

// 删除一个域名
export const deleteDomain = (id: number) => {
  // DELETE 请求通常没有响应体，所以 T 可以是 any 或 unknown
  return fetcher<any>(FetcherMethod.DELETE, `/api/v1/domains/${id}`)
}

// 更新一个域名（包括公开状态和配置信息）
export const updateDomain = (id: number, data: { is_public: boolean, billing_data: BillingDataMod }) => {
    return fetcher<Domain>(FetcherMethod.PUT, `/api/v1/domains/${id}`, data)
}