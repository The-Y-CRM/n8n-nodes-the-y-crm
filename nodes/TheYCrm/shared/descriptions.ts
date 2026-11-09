import type { INodeProperties } from 'n8n-workflow';

const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

export const contactSelect: INodeProperties = {
	displayName: 'Contact',
	name: 'contactId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'The contact to use',
	// The URL path comes from the contact parameter so that n8n uses the extracted ID for every mode (list, URL, ID).
	routing: {
		request: {
			url: '=/contacts/{{$value}}',
		},
	},
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a contact...',
			typeOptions: {
				searchListMethod: 'searchContacts',
				searchable: true,
				searchFilterRequired: false,
			},
		},
		{
			displayName: 'By URL',
			name: 'url',
			type: 'string',
			placeholder: 'e.g. https://crm.the-y.at/app/contacts/2f1c…',
			extractValue: {
				type: 'regex',
				regex: `\\/app\\/contacts\\/(${UUID})`,
			},
			validation: [
				{
					type: 'regex',
					properties: {
						regex: `^https?:\\/\\/.+\\/app\\/contacts\\/${UUID}.*`,
						errorMessage: 'Not a valid The-Y CRM contact URL',
					},
				},
			],
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 2f1c0a4e-5b7d-4c3e-9a10-1b2c3d4e5f60',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: `^${UUID}$`,
						errorMessage: 'Not a valid contact ID (expected a UUID)',
					},
				},
			],
		},
	],
};

/** Key/value pairs for custom contact fields → body.custom = { key: value } */
export const customFieldsCollection: INodeProperties = {
	displayName: 'Custom Fields',
	name: 'customFields',
	type: 'fixedCollection',
	placeholder: 'Add Custom Field',
	default: {},
	typeOptions: {
		multipleValues: true,
	},
	description:
		'Custom contact fields. Use the field key as shown in The-Y CRM under Settings → Custom fields.',
	options: [
		{
			displayName: 'Field',
			name: 'field',
			values: [
				{
					displayName: 'Field Key',
					name: 'key',
					type: 'string',
					default: '',
					placeholder: 'e.g. customer_number',
				},
				{
					displayName: 'Value',
					name: 'value',
					type: 'string',
					default: '',
				},
			],
		},
	],
	routing: {
		send: {
			type: 'body',
			property: 'custom',
			value:
				'={{ ($value.field || []).filter((f) => f.key).reduce((all, f) => { all[f.key] = f.value; return all; }, {}) }}',
		},
	},
};
