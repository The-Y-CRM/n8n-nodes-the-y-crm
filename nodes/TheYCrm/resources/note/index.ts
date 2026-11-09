import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['note'], operation: ['create'] };

const targetId = (target: string, displayName: string, property: string): INodeProperties => ({
	displayName,
	name: `${target}Id`,
	type: 'string',
	required: true,
	default: '',
	displayOptions: { show: { ...show, attachTo: [target] } },
	routing: { send: { type: 'body', property } },
});

export const noteDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['note'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a note',
				description:
					'Add a note to a contact, company or deal (timeline), or an internal note to a conversation (never sent to the customer)',
				routing: { request: { method: 'POST', url: '/notes' } },
			},
		],
		default: 'create',
	},
	{
		displayName: 'Attach To',
		name: 'attachTo',
		type: 'options',
		default: 'contact',
		displayOptions: { show },
		options: [
			{ name: 'Company', value: 'company' },
			{ name: 'Contact', value: 'contact' },
			{ name: 'Conversation (Internal Note)', value: 'conversation' },
			{ name: 'Deal', value: 'deal' },
		],
	},
	targetId('company', 'Company ID', 'company_id'),
	targetId('contact', 'Contact ID', 'contact_id'),
	targetId('conversation', 'Conversation ID', 'conversation_id'),
	targetId('deal', 'Deal ID', 'deal_id'),
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'text' } },
	},
];
