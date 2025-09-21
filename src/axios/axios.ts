import axios  from "axios"
import type { AxiosRequestConfig } from "axios";

const baseReqConfig:AxiosRequestConfig = {
    baseURL:"https://api.coingecko.com/api/v3"
}

export const api = axios.create(baseReqConfig)