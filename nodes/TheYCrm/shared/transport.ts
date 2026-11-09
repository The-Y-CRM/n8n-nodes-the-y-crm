import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
} from 'n8n-workflow';

export const CREDENTIAL_NAME = 'theYCrmApi';
export const THE_Y_CLOUD_URL = 'https://crm.the-y.at';

/** Base URL without trailing slash, e.g. https://crm.the-y.at */
export function normalizeBaseUrl(raw: unknown): string {
	return String(raw ?? '')
		.trim()
		.replace(/\/+$/, '');
}

/**
 * Base URL from the credentials: The-Y Cloud → https://crm.the-y.at, self-hosted → the saved address.
 * Credentials from version 0.1.0 have no environment: they keep their saved address.
 */
export function baseUrlFromCredentials(credentials: IDataObject): string {
	const own = normalizeBaseUrl(credentials.baseUrl);
	if (credentials.environment === 'cloud' || !own) return THE_Y_CLOUD_URL;
	return own;
}

export async function getBaseUrl(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions | IWebhookFunctions,
): Promise<string> {
	const credentials = await this.getCredentials(CREDENTIAL_NAME);
	return baseUrlFromCredentials(credentials);
}

/** Request against the public The-Y CRM API (/api/ext/v1). */
export async function theYCrmApiRequest(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	resource: string,
	qs: IDataObject = {},
	body: IDataObject | undefined = undefined,
) {
	const baseUrl = await getBaseUrl.call(this);
	const options: IHttpRequestOptions = {
		method,
		qs,
		body,
		url: `${baseUrl}/api/ext/v1${resource}`,
		json: true,
	};
	return this.helpers.httpRequestWithAuthentication.call(this, CREDENTIAL_NAME, options);
}
