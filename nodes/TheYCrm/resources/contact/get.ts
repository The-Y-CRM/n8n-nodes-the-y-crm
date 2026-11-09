import type { INodeProperties } from 'n8n-workflow';
import { contactSelect } from '../../shared/descriptions';

const showOnlyForContactGet = {
	operation: ['get'],
	resource: ['contact'],
};

export const contactGetDescription: INodeProperties[] = [
	{
		...contactSelect,
		displayOptions: { show: showOnlyForContactGet },
	},
];
