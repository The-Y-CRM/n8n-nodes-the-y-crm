import type { INodeProperties } from 'n8n-workflow';
import { recordLocator } from '../../shared/descriptions';

const show = (operation: string[]) => ({ resource: ['conversation'], operation });

/** The API returns at most 200 conversations per page. */
const PAGE_SIZE = 200;

const conversationLocator = (requestUrl: string) =>
	recordLocator({
		name: 'conversationId',
		displayName: 'Conversation',
		appPath: 'inbox',
		requestUrl,
		description: 'The conversation to use (ID or link from the inbox)',
	});

export const conversationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['conversation'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a conversation',
				description: 'Get a conversation with its latest messages',
				routing: { request: { method: 'GET' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many conversations',
				description: 'Get conversations, newest activity first, optionally filtered',
				routing: {
					request: { method: 'GET', url: '/conversations' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Send Message',
				value: 'reply',
				action: 'Send a message in a conversation',
				description:
					'Reply to the customer on the same channel as the conversation (email, WhatsApp, SMS, web chat, …)',
				routing: { request: { method: 'POST' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a conversation',
				description: 'Change the status or the assignee of a conversation',
				routing: { request: { method: 'PATCH' } },
			},
		],
		default: 'get',
	},

	// ── Get ──
	{
		...conversationLocator('=/conversations/{{$value}}'),
		displayOptions: { show: show(['get', 'update']) },
	},
	{
		displayName: 'Messages',
		name: 'messageLimit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 500 },
		default: 200,
		description: 'How many of the latest messages to include',
		displayOptions: { show: show(['get']) },
		routing: { send: { type: 'query', property: 'messages' } },
	},

	// ── Get Many ──
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: show(['getAll']) },
		routing: {
			send: { paginate: '={{ $value }}' },
			operations: {
				pagination: {
					type: 'offset',
					properties: {
						limitParameter: 'limit',
						offsetParameter: 'offset',
						pageSize: PAGE_SIZE,
						type: 'query',
					},
				},
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: PAGE_SIZE },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { ...show(['getAll']), returnAll: [false] } },
		routing: { send: { type: 'query', property: 'limit' }, output: { maxResults: '={{$value}}' } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: show(['getAll']) },
		options: [
			{
				displayName: 'Channel',
				name: 'channel',
				type: 'options',
				default: 'whatsapp',
				options: [
					{ name: 'Call', value: 'call' },
					{ name: 'Email', value: 'email' },
					{ name: 'Facebook Comment', value: 'fb_comment' },
					{ name: 'Instagram', value: 'instagram' },
					{ name: 'Instagram Comment', value: 'ig_comment' },
					{ name: 'Messenger', value: 'messenger' },
					{ name: 'SMS', value: 'sms' },
					{ name: 'Web Chat', value: 'webchat' },
					{ name: 'WhatsApp', value: 'whatsapp' },
				],
				routing: { send: { type: 'query', property: 'channel' } },
			},
			{
				displayName: 'Contact ID',
				name: 'contactId',
				type: 'string',
				default: '',
				description: 'Only conversations of this contact',
				routing: { send: { type: 'query', property: 'contact_id' } },
			},
			{
				displayName: 'Since',
				name: 'since',
				type: 'dateTime',
				default: '',
				description: 'Only conversations with a message at or after this time',
				routing: { send: { type: 'query', property: 'since' } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'open',
				options: [
					{ name: 'Closed', value: 'closed' },
					{ name: 'Open', value: 'open' },
					{ name: 'Snoozed', value: 'snoozed' },
				],
				routing: { send: { type: 'query', property: 'status' } },
			},
		],
	},

	// ── Send Message ──
	{
		...conversationLocator('=/conversations/{{$value}}/messages'),
		displayOptions: { show: show(['reply']) },
	},
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		description:
			'The message. With a WhatsApp template this is optional: The-Y CRM fills in the template text.',
		displayOptions: { show: show(['reply']) },
		routing: { send: { type: 'body', property: 'text' } },
	},
	{
		displayName: 'Use WhatsApp Template',
		name: 'useTemplate',
		type: 'boolean',
		default: false,
		description:
			'Whether to send an approved WhatsApp template. Outside the 24-hour window WhatsApp only allows templates.',
		displayOptions: { show: show(['reply']) },
	},
	{
		displayName: 'Template Name',
		name: 'templateName',
		type: 'string',
		default: '',
		placeholder: 'e.g. appointment_reminder',
		description: 'Name of the approved template at Meta',
		displayOptions: { show: { ...show(['reply']), useTemplate: [true] } },
		routing: {
			send: {
				type: 'body',
				property: 'template',
				value:
					'={{ { name: $value, language: $parameter.templateLanguage, params: (($parameter.templateParameters || {}).parameter || []).map((p) => p.value) } }}',
			},
		},
	},
	{
		displayName: 'Template Language',
		name: 'templateLanguage',
		type: 'string',
		default: 'de',
		placeholder: 'e.g. de, en, en_US',
		displayOptions: { show: { ...show(['reply']), useTemplate: [true] } },
	},
	{
		displayName: 'Template Parameters',
		name: 'templateParameters',
		type: 'fixedCollection',
		placeholder: 'Add Parameter',
		default: {},
		typeOptions: { multipleValues: true, sortable: true },
		description: 'Values for {{1}}, {{2}}, … in the order of the template',
		displayOptions: { show: { ...show(['reply']), useTemplate: [true] } },
		options: [
			{
				displayName: 'Parameter',
				name: 'parameter',
				values: [{ displayName: 'Value', name: 'value', type: 'string', default: '' }],
			},
		],
	},

	// ── Update ──
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: show(['update']) },
		options: [
			{
				displayName: 'Assignee Name or ID',
				name: 'assignee',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getUsers' },
				default: '',
				description:
					'Team member who handles the conversation. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				routing: {
					send: {
						type: 'body',
						property: 'assignee_user_id',
						value: '={{ $value === "none" ? null : $value }}',
					},
				},
			},
			{
				displayName: 'Snooze Until',
				name: 'snoozeUntil',
				type: 'dateTime',
				default: '',
				description: 'Only with status Snoozed: when the conversation opens again',
				routing: { send: { type: 'body', property: 'snooze_until' } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'closed',
				options: [
					{ name: 'Closed', value: 'closed' },
					{ name: 'Open', value: 'open' },
					{ name: 'Snoozed', value: 'snoozed' },
				],
				routing: { send: { type: 'body', property: 'status' } },
			},
		],
	},
];
