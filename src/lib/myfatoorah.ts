/**
 * MyFatoorah Payment Gateway Integration
 *
 * Demo/test mode configuration. Uses MyFatoorah's test API.
 * For production, update the API key and base URL.
 */

const MF_BASE_URL = process.env.MYFATOORAH_BASE_URL || "https://apitest.myfatoorah.com";
const MF_API_KEY = process.env.MYFATOORAH_API_KEY || "rLtt6JWvbUHDDhsZnfpAhpYk4dxYDQkbcPTyGaKp2TYqQgG7FGZ5Th_WD53Oq8ebR5cWxd9LhTMUFMBzmYVET_VCNjKLma15rdXHD3bJIHBiLEiOiEcfP2IFHINtJF7P"; // Test key

export interface MFSendPaymentInput {
  /** Invoice amount in KWD */
  invoiceValue: number;
  /** Player or subscription display name */
  displayName: string;
  /** Customer name */
  customerName: string;
  /** Customer email */
  customerEmail: string;
  /** Customer phone */
  customerPhone: string;
  /** Callback URL after payment */
  callBackUrl: string;
  /** Error callback URL */
  errorUrl: string;
  /** Internal reference (e.g. subscription ID or registration ID) */
  userDefinedField?: string;
}

export interface MFPaymentResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors: string | null;
  Data: {
    InvoiceId: number;
    InvoiceURL: string;
    CustomerReference: string;
    UserDefinedField: string;
  } | null;
}

export interface MFPaymentStatusResponse {
  IsSuccess: boolean;
  Message: string;
  Data: {
    InvoiceId: number;
    InvoiceStatus: string; // "Paid", "Pending", "Failed", "Expired"
    InvoiceReference: string;
    CustomerReference: string;
    CreatedDate: string;
    ExpiryDate: string;
    InvoiceValue: number;
    Comments: string | null;
    CustomerName: string;
    CustomerMobile: string;
    CustomerEmail: string;
    UserDefinedField: string;
    InvoiceDisplayValue: string;
    InvoiceItems: unknown[];
    InvoiceTransactions: Array<{
      TransactionDate: string;
      PaymentGateway: string;
      ReferenceId: string;
      TrackId: string;
      TransactionId: string;
      PaymentId: string;
      AuthorizationId: string;
      TransactionStatus: string;
      TransationValue: string;
      CustomerServiceCharge: string;
      TotalServiceCharge: string;
      DueValue: string;
      PaidCurrency: string;
      PaidCurrencyValue: string;
      Currency: string;
      Error: string | null;
      ErrorCode: string | null;
    }>;
  } | null;
}

/**
 * Create a payment invoice via MyFatoorah SendPayment API
 */
export async function createPayment(input: MFSendPaymentInput): Promise<MFPaymentResponse> {
  const body = {
    NotificationOption: "ALL",
    InvoiceValue: input.invoiceValue,
    DisplayCurrencyIso: "KWD",
    CustomerName: input.customerName,
    CustomerEmail: input.customerEmail,
    MobileCountryCode: "+965",
    CustomerMobile: input.customerPhone.replace(/[^\d]/g, "").slice(-8),
    CallBackUrl: input.callBackUrl,
    ErrorUrl: input.errorUrl,
    Language: "EN",
    UserDefinedField: input.userDefinedField || "",
    CustomerReference: input.displayName,
    InvoiceItems: [
      {
        ItemName: input.displayName,
        Quantity: 1,
        UnitPrice: input.invoiceValue,
      },
    ],
  };

  const response = await fetch(`${MF_BASE_URL}/v2/SendPayment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MF_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

/**
 * Check payment status using InvoiceId
 */
export async function getPaymentStatus(paymentId: string): Promise<MFPaymentStatusResponse> {
  const body = {
    Key: paymentId,
    KeyType: "InvoiceId",
  };

  const response = await fetch(`${MF_BASE_URL}/v2/GetPaymentStatus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MF_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

/**
 * Verify a payment callback and return the status
 */
export async function verifyPaymentCallback(paymentId: string): Promise<{
  success: boolean;
  invoiceId: string;
  paymentRef: string;
  status: string;
  amount: number;
  date: string;
}> {
  const result = await getPaymentStatus(paymentId);

  if (!result.IsSuccess || !result.Data) {
    return {
      success: false,
      invoiceId: paymentId,
      paymentRef: "",
      status: "Failed",
      amount: 0,
      date: new Date().toISOString(),
    };
  }

  const data = result.Data;
  const lastTx = data.InvoiceTransactions?.[data.InvoiceTransactions.length - 1];

  return {
    success: data.InvoiceStatus === "Paid",
    invoiceId: String(data.InvoiceId),
    paymentRef: lastTx?.PaymentId || lastTx?.ReferenceId || "",
    status: data.InvoiceStatus,
    amount: data.InvoiceValue,
    date: lastTx?.TransactionDate || data.CreatedDate,
  };
}
