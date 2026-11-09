import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { contactDescription } from './resources/contact';
import { searchContacts } from './listSearch/searchContacts';

export class TheYCrm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'The-Y CRM',
		name: 'theYCrm',
		icon: { light: 'file:../../icons/the-y.svg', dark: 'file:../../icons/the-y.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create, get, search and update contacts in The-Y CRM',
		defaults: {
			name: 'The-Y CRM',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'theYCrmApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}/api/ext/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Contact',
						value: 'contact',
					},
				],
				default: 'contact',
			},
			...contactDescription,
		],
	};

	methods = {
		listSearch: {
			searchContacts,
		},
	};
}
