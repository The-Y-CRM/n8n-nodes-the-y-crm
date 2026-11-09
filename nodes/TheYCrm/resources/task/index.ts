import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['task'], operation: ['create'] };

const idField = (displayName: string, name: string, property: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	description:
		'Link the task to this record (use only one of contact, company, deal or conversation)',
	routing: { send: { type: 'body', property } },
});

export const taskDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['task'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a task',
				description: 'Create a task, for example a callback for a contact',
				routing: {
					request: { method: 'POST', url: '/tasks' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'task' } }] },
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
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'title' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Assignee Name or ID',
				name: 'assignee',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getUsers' },
				default: '',
				description:
					'Team member who does the task. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				routing: {
					send: {
						type: 'body',
						property: 'assignee_user_id',
						value: '={{ $value === "none" ? null : $value }}',
					},
				},
			},
			idField('Company ID', 'companyId', 'company_id'),
			idField('Contact ID', 'contactId', 'contact_id'),
			idField('Conversation ID', 'conversationId', 'conversation_id'),
			idField('Deal ID', 'dealId', 'deal_id'),
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				routing: { send: { type: 'body', property: 'description' } },
			},
			{
				displayName: 'Due At',
				name: 'dueAt',
				type: 'dateTime',
				default: '',
				routing: { send: { type: 'body', property: 'due_at' } },
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				default: 'normal',
				options: [
					{ name: 'High', value: 'high' },
					{ name: 'Low', value: 'low' },
					{ name: 'Normal', value: 'normal' },
					{ name: 'Urgent', value: 'urgent' },
				],
				routing: { send: { type: 'body', property: 'priority' } },
			},
			{
				displayName: 'Type',
				name: 'kind',
				type: 'options',
				default: 'todo',
				options: [
					{ name: 'Call', value: 'call' },
					{ name: 'Callback', value: 'callback' },
					{ name: 'Email', value: 'email' },
					{ name: 'Follow-Up', value: 'follow_up' },
					{ name: 'To-Do', value: 'todo' },
				],
				routing: { send: { type: 'body', property: 'kind' } },
			},
		],
	},
];
