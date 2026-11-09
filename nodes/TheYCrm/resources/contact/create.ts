import type { INodeProperties } from 'n8n-workflow';
import { customFieldsCollection } from '../../shared/descriptions';

const showOnlyForContactCreate = {
	operation: ['create', 'upsert'],
	resource: ['contact'],
};

export const contactCreateDescription: INodeProperties[] = [
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		displayOptions: {
			show: showOnlyForContactCreate,
		},
		description:
			'Email address of the contact. Create: enter at least a name or an email address. Create or Update: required, an existing contact with this address is updated.',
		routing: {
			send: {
				type: 'body',
				property: 'email',
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForContactCreate,
		},
		options: [
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				routing: {
					send: {
						type: 'body',
						property: 'first_name',
					},
				},
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				routing: {
					send: {
						type: 'body',
						property: 'last_name',
					},
				},
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				placeholder: 'e.g. +4366012345678',
				description: 'Phone number in international format',
				routing: {
					send: {
						type: 'body',
						property: 'phone',
					},
				},
			},
			customFieldsCollection,
		],
	},
];
