// Unified API types for the app

export type ApiResponseList<T> = {
    total: number;
    messages: string;
    results: Array<T>;
    count: number;
    next: number | null;
    previous: number | null;
    links?: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
  };
  
  
  export type ApiResponseError = {
    type: string;
    status: number;
    path: string;
    message: string;
    error_code: string;
    errors: Array<{
      message: string;
      error_code: string;
      field: string;
    }>;
    detail: string;
    data: {
      detail: string;
    };
    // For Vee-Validate error object
    // https://vee-validate.logaretm.com/v3/advanced/server-side-validation.html#handling-backend-validation
    formErrors?: Record<string, string>;
    statusCode?: number;
    [key: string]: any;
  };
  
  export type ApiRequestParams = {
    page?: number | string;
    per_page?: number;
    [key: string]: any;
  };
  
  export type ApiResponseData<T> = {
    data: T;
    
  };