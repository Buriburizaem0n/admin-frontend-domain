export interface BillingDataMod {
    registrar?: string;
    registeredDate?: string;
    endDate?: string;
    renewalPrice?: string;
    autoRenewal?: string;
    notes?: string;
    cycle?: string;
    amount?: string;
}

export interface Domain {
    ID: number;
    Domain: string;
    Status: string;
    VerifyToken: string;
    IsPublic: boolean;
    BillingData: BillingDataMod | null;
    expires_in_days?: number;
}
