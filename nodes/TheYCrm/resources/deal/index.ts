import type { INodeProperties } from 'n8n-workflow';
import { dealCustomFieldsCollection, recordLocator } from '../../shared/descriptions';

const show = (operation: string[]) => ({ resource: ['deal'], operation });

const stageField: INodeProperties = {
	displayName: 'Stage Name or ID',
	name: 'stage',
	type: 'options',
	typeOptions: { loadOptionsMethod: 'getStages' },
	default: '',
	description:
		'Pipeline stage. The pipeline follows the stage. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	routing: { send: { type: 'body', property: 'stage_id' } },
};

const sharedFields: INodeProperties[] = [
	{
		displayName: 'Company ID',
		name: 'companyId',
		type: 'string',
		default: '',
		routing: { send: { type: 'body', property: 'company_id' } },
	},
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'string',
		default: '',
		routing: { send: { type: 'body', property: 'contact_id' } },
	},
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'string',
		default: 'EUR',
		placeholder: 'e.g. EUR',
		description: 'Three-letter currency code',
		routing: { send: { type: 'body', property: 'currency' } },
	},
	dealCustomFieldsCollection,
	{
		displayName: 'Expected Close Date',
		name: 'expectedCloseDate',
		type: 'dateTime',
		default: '',
		routing: {
			send: {
				type: 'body',
				property: 'expected_close_date',
				value: '={{ $value ? String($value).slice(0, 10) : null }}',
			},
		},
	},
	stageField,
	{
		displayName: 'Value',
		name: 'value',
		type: 'number',
		typeOptions: { minValue: 0, numberPrecision: 2 },
		default: 0,
		routing: { send: { type: 'body', property: 'value' } },
	},
];

export const dealDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['deal'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a deal',
				description:
					'Create a new deal. Without a stage it starts in the first stage of the default pipeline.',
				routing: {
					request: { method: 'POST', url: '/deals' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'deal' } }] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a deal',
				description: 'Get the data of a single deal',
				routing: { request: { method: 'GET' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a deal',
				description:
					'Change the stage or other fields of a deal. Fields you leave out stay unchanged.',
				routing: {
					request: { method: 'PATCH' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'deal' } }] },
				},
			},
		],
		default: 'create',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: show(['create']) },
		routing: { send: { type: 'body', property: 'title' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: show(['create']) },
		options: sharedFields,
	},
	{
		...recordLocator({
			name: 'dealId',
			displayName: 'Deal',
			appPath: 'deals',
			requestUrl: '=/deals/{{$value}}',
			description: 'The deal to use (ID or link to the deal)',
		}),
		displayOptions: { show: show(['get', 'update']) },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: show(['update']) },
		options: [
			...sharedFields,
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'title' } },
			},
		],
	},
];
