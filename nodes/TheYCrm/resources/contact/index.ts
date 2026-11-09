import type { INodeProperties } from 'n8n-workflow';
import { contactCreateDescription } from './create';
import { contactGetDescription } from './get';
import { contactGetManyDescription } from './getAll';
import { contactUpdateDescription } from './update';

const showOnlyForContacts = {
	resource: ['contact'],
};

export const contactDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForContacts,
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a contact',
				description: 'Create a new contact',
				routing: {
					request: {
						method: 'POST',
						url: '/contacts',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'contact',
								},
							},
						],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a contact',
				description: 'Get the data of a single contact',
				routing: {
					request: {
						method: 'GET',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many contacts',
				description: 'Get many contacts, optionally filtered by a search term',
				routing: {
					request: {
						method: 'GET',
						url: '/contacts',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data',
								},
							},
						],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a contact',
				description: 'Update fields of a contact. Fields you leave out stay unchanged.',
				routing: {
					request: {
						method: 'PATCH',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'contact',
								},
							},
						],
					},
				},
			},
		],
		default: 'create',
	},
	...contactCreateDescription,
	...contactGetDescription,
	...contactGetManyDescription,
	...contactUpdateDescription,
];
