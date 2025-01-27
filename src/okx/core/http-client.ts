import CryptoJS from 'crypto-js';
import { OKXConfig } from '../types';

class APIError extends Error {
    constructor(
        message: string,
        public status?: number,
        public statusText?: string,
        public responseBody?: any,
        public requestDetails?: {
            method: string,
            path: string,
            params?: Record<string, string | undefined>,
            queryString?: string
        }
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export class HTTPClient {
    private readonly config: OKXConfig;

    constructor(config: OKXConfig) {
        this.config = {
            baseUrl: 'https://www.okx.com',
            maxRetries: 3,
            timeout: 30000,
            ...config
        };
    }

    private getHeaders(timestamp: string, method: string, path: string, queryString = "") {
        const stringToSign = timestamp + method + path + queryString;

        return {
            "Content-Type": "application/json",
            "OK-ACCESS-KEY": this.config.apiKey,
            "OK-ACCESS-SIGN": CryptoJS.enc.Base64.stringify(
                CryptoJS.HmacSHA256(stringToSign, this.config.secretKey)
            ),
            "OK-ACCESS-TIMESTAMP": timestamp,
            "OK-ACCESS-PASSPHRASE": this.config.apiPassphrase,
            "OK-ACCESS-PROJECT": this.config.projectId,
        };
    }

    private async handleErrorResponse(response: Response, requestDetails: any) {
        let responseBody;
        try {
            responseBody = await response.json();
        } catch (e) {
            responseBody = await response.text();
        }

        throw new APIError(
            `HTTP error! status: ${response.status}`,
            response.status,
            response.statusText,
            responseBody,
            requestDetails
        );
    }

    async request<T>(method: string, path: string, params?: Record<string, string | undefined>): Promise<T> {
        const timestamp = new Date().toISOString();

        // Filter out undefined values from params
        const cleanParams = params ? Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== undefined)
        ) as Record<string, string> : undefined;

        const queryString = cleanParams ? "?" + new URLSearchParams(cleanParams).toString() : "";
        const headers = this.getHeaders(timestamp, method, path, queryString);
        const requestDetails = {
            method,
            path,
            params: cleanParams,
            queryString,
            url: `${this.config.baseUrl}${path}${queryString}`
        };

        // Log request details in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Request Details:', {
                url: requestDetails.url,
                method: requestDetails.method,
                headers: {
                    ...headers,
                    'OK-ACCESS-SIGN': '***', // Hide sensitive data
                    'OK-ACCESS-KEY': '***',
                    'OK-ACCESS-PASSPHRASE': '***'
                },
                params: requestDetails.params
            });
        }

        let retries = 0;
        while (retries < this.config.maxRetries!) {
            try {
                const response = await fetch(`${this.config.baseUrl}${path}${queryString}`, {
                    method,
                    headers
                });

                if (!response.ok) {
                    await this.handleErrorResponse(response, requestDetails);
                }

                const data = await response.json();

                // Log response in development
                if (process.env.NODE_ENV === 'development') {
                    console.log('Response:', JSON.stringify(data, null, 2));
                }

                if (data.code !== "0") {
                    throw new APIError(
                        `API Error: ${data.msg}`,
                        response.status,
                        response.statusText,
                        data,
                        requestDetails
                    );
                }

                return data as T;
            } catch (error) {
                if (error instanceof APIError) {
                    if (retries === this.config.maxRetries! - 1) throw error;
                } else {
                    if (retries === this.config.maxRetries! - 1) {
                        throw new APIError(
                            error instanceof Error ? error.message : 'Unknown error',
                            undefined,
                            undefined,
                            undefined,
                            requestDetails
                        );
                    }
                }
                retries++;
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }
        }
        throw new Error("Max retries exceeded");
    }
}