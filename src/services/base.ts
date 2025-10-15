import type {
    ApiRequestParams,
    ApiResponseData,
    ApiResponseError,
    ApiResponseList,
  } from '@/types/api'
import type { AxiosInstance, AxiosResponse } from 'axios'

export class BaseRepository<T = any, R = any> {
constructor(
    protected $axios: AxiosInstance,
    protected resource: string,
) {}

async show(params?: ApiRequestParams): Promise<ApiResponseList<T>> {
    // const response = this.$axios.get(`/${this.resource}/`, { params })
    const response: AxiosResponse<ApiResponseList<T>> = await this.$axios.get(
    `/${this.resource}/`,
    { params },
    )
    return response.data
}

async index(
    id: string | number,
    params: ApiRequestParams = {},
    pathParams: string = '',
): Promise<ApiResponseData<T>> {
    const response: AxiosResponse<ApiResponseData<T>> = await this.$axios.get(
    `/${this.resource}/${id}/${pathParams}`,
    { params },
    )
    return response.data
}

async create(
    payload: R  | null,
    { visibleFields = [] }: { visibleFields?: string[] } = {},
): Promise<T> {
    try {
    const response = await this.$axios.post(`/${this.resource}/`, payload)
    return response.data
    } catch (error) {
    throw this.buildFormErrors(error as ApiResponseError, visibleFields)
    }
}

async update(
    id: string | number,
    payload: Partial<R>,
    { visibleFields = [] }: { visibleFields?: string[] } = {},
    pathParams: string = '',
): Promise<T> {
    try {
    const response = await this.$axios.put(`/${this.resource}/${id}/${pathParams}`, payload)
    return response.data
    } catch (error) {
    throw this.buildFormErrors(error as ApiResponseError, visibleFields)
    }
}

async destroy(id: string | number): Promise<void> {
    await this.$axios.delete(`/${this.resource}/${id}/`)
}

// Xử lý lỗi form
protected buildFormErrors(error: ApiResponseError, visibleFields: string[] = []) {
    const formErrors = visibleFields.reduce(
    (acc, field) => {
        const errorItem = error.errors?.find((item: { field: string; message: string }) => item.field === field)
        if (errorItem) {
        acc[field] = errorItem.message
        }
        return acc
    },
    {} as Record<string, string>,
    )

    if (Object.keys(formErrors).length > 0) {
    error.formErrors = formErrors
    }
    return error
}
}