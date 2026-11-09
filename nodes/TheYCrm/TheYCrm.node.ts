import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { contactDescription } from './resources/contact';
import { conversationDescription } from './resources/conversation';
import { dealDescription } from './resources/deal';
import { noteDescription } from './resources/note';
import { taskDescription } from './resources/task';
import { searchContacts } from './listSearch/searchContacts';
import { getStages, getUsers } from './loadOptions';
import { BASE_URL_EXPRESSION } from '../../credentials/TheYCrmApi.credentials';

export class TheYCrm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'The-Y CRM',
		name: 'theYCrm',
		icon: { light: 'file:../../icons/the-y.svg', dark: 'file:../../icons/the-y.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Contacts, conversations and messages, deals, tasks and notes in The-Y CRM',
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
			baseURL: BASE_URL_EXPRESSION,
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
					{
						name: 'Conversation',
						value: 'conversation',
					},
					{
						name: 'Deal',
						value: 'deal',
					},
					{
						name: 'Note',
						value: 'note',
					},
					{
						name: 'Task',
						value: 'task',
					},
				],
				default: 'contact',
			},
			...contactDescription,
			...conversationDescription,
			...dealDescription,
			...taskDescription,
			...noteDescription,
		],
	};

	methods = {
		listSearch: {
			searchContacts,
		},
		loadOptions: {
			getStages,
			getUsers,
		},
	};
}
