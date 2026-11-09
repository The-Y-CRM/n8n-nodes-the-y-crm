import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
} from 'n8n-workflow';
import { getBaseUrl, theYCrmApiRequest } from '../shared/transport';

type ContactListItem = {
	id: string;
	first_name?: string | null;
	last_name?: string | null;
	emails?: Array<{ value?: string }> | null;
	phones?: Array<{ value?: string }> | null;
	company?: string | null;
};

type ContactListResponse = {
	data: ContactListItem[];
	hasMore?: boolean;
};

const PAGE_SIZE = 50;

function contactLabel(contact: ContactListItem): string {
	const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim();
	const email = contact.emails?.[0]?.value ?? '';
	const phone = contact.phones?.[0]?.value ?? '';
	const main = name || email || phone || contact.id;
	const extra = [name ? email : '', contact.company ?? ''].filter(Boolean).join(', ');
	return extra ? `${main} (${extra})` : main;
}

export async function searchContacts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const offset = paginationToken ? Number(paginationToken) || 0 : 0;
	const qs: IDataObject = { limit: PAGE_SIZE, offset };
	if (filter) qs.q = filter;

	const response = (await theYCrmApiRequest.call(
		this,
		'GET',
		'/contacts',
		qs,
	)) as ContactListResponse;
	const baseUrl = await getBaseUrl.call(this);

	const results: INodeListSearchItems[] = (response.data ?? []).map((contact) => ({
		name: contactLabel(contact),
		value: contact.id,
		url: `${baseUrl}/app/contacts/${contact.id}`,
	}));

	return {
		results,
		paginationToken: response.hasMore ? String(offset + PAGE_SIZE) : undefined,
	};
}
