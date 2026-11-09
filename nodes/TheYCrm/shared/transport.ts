import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

export const CREDENTIAL_NAME = 'theYCrmApi';

/** Base URL without trailing slash, e.g. https://crm.the-y.at */
export function normalizeBaseUrl(raw: unknown): string {
	return String(raw ?? '')
		.trim()
		.replace(/\/+$/, '');
}

export async function getBaseUrl(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
): Promise<string> {
	const credentials = await this.getCredentials(CREDENTIAL_NAME);
	return normalizeBaseUrl(credentials.baseUrl);
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
