import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/** Address of the hosted The-Y CRM cloud. */
export const THE_Y_CLOUD_URL = 'https://crm.the-y.at';

/**
 * Base URL expression shared by the credential test and the nodes.
 * Credentials from version 0.1.0 have no `environment` yet: they keep using their saved base URL.
 */
export const BASE_URL_EXPRESSION =
	'={{ ($credentials.environment === "cloud" || !$credentials.baseUrl) ? "https://crm.the-y.at" : String($credentials.baseUrl).replace(/\\/+$/, "") }}/api/ext/v1';

export class TheYCrmApi implements ICredentialType {
	name = 'theYCrmApi';

	displayName = 'The-Y CRM API';

	icon: Icon = { light: 'file:../icons/the-y.svg', dark: 'file:../icons/the-y.dark.svg' };

	documentationUrl = 'https://the-y.at/en/docs/api/';

	properties: INodeProperties[] = [
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			default: 'cloud',
			options: [
				{
					name: 'The-Y Cloud (crm.the-y.at)',
					value: 'cloud',
				},
				{
					name: 'Self-Hosted (Own URL)',
					value: 'selfHosted',
				},
			],
			description:
				'Where your The-Y CRM runs. Choose Self-Hosted if you run The-Y CRM on your own server.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://crm.example.com',
			description:
				'Address of your own The-Y CRM, for example https://crm.example.com. n8n must be able to reach this address.',
			displayOptions: {
				show: {
					environment: ['selfHosted'],
				},
			},
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Create a key in The-Y CRM under Settings → Integrations → API keys and give it the permissions you need (for example contacts:read, conversations:write, webhooks:manage for the trigger). The key starts with "tyk_".',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: BASE_URL_EXPRESSION,
			url: '/me',
			method: 'GET',
		},
	};
}
