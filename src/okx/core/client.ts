// src/core/client.ts
import { HTTPClient } from "./http-client";
import { DexAPI } from "../api/dex";
import { BridgeAPI } from "../api/bridge";
import type { OKXConfig } from "../types";

export class OKXDexClient {
    private config: OKXConfig;
    private httpClient: HTTPClient;
    public dex: DexAPI;
    public bridge: BridgeAPI;

    constructor(config: OKXConfig) {
        this.config = {
            baseUrl: "https://www.okx.com",
            maxRetries: 3,
            timeout: 30000,
            ...config,
        };

        this.httpClient = new HTTPClient(this.config);
        this.dex = new DexAPI(this.httpClient, this.config);
        this.bridge = new BridgeAPI(this.httpClient);
    }
}
