import type { INodeProperties } from 'n8n-workflow';
import { contactSelect, customFieldsCollection } from '../../shared/descriptions';

const showOnlyForContactUpdate = {
	operation: ['update'],
	resource: ['contact'],
};

export const contactUpdateDescription: INodeProperties[] = [
	{
		...contactSelect,
		displayOptions: { show: showOnlyForContactUpdate },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForContactUpdate,
		},
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Replaces the first email address of the contact. Other addresses stay.',
				routing: {
					send: {
						type: 'body',
						property: 'email',
					},
				},
			},
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
				description:
					'Replaces the first phone number of the contact (international format). Other numbers stay.',
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
