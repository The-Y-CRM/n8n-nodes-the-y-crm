import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TheYCrmApi implements ICredentialType {
	name = 'theYCrmApi';

	displayName = 'The-Y CRM API';

	icon: Icon = { light: 'file:../icons/the-y.svg', dark: 'file:../icons/the-y.dark.svg' };

	documentationUrl = 'https://the-y.at/en/docs/api/';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://crm.the-y.at',
			placeholder: 'https://crm.the-y.at',
			description:
				'Address of your The-Y CRM. Keep the default for the hosted cloud. If you host The-Y CRM yourself, enter your own address, for example https://crm.example.com.',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Create a key in The-Y CRM under Settings → Integrations → API keys. Give it the permissions contacts:read and contacts:write. The key starts with "tyk_".',
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
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}/api/ext/v1',
			url: '/contacts',
			method: 'GET',
			qs: {
				limit: 1,
			},
		},
	};
}
