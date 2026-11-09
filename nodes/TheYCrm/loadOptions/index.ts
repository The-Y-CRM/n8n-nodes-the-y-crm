import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { theYCrmApiRequest } from '../shared/transport';

type Pipeline = {
	id: string;
	name: string;
	stages: Array<{ id: string; name: string; is_won?: boolean; is_lost?: boolean }>;
};
type User = { id: string; name: string; email?: string };

/** Stages of all pipelines as "Pipeline › Stage" (needs the API permission deals:read). */
export async function getStages(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = (await theYCrmApiRequest.call(this, 'GET', '/pipelines')) as {
		data?: Pipeline[];
	};
	const options: INodePropertyOptions[] = [];
	for (const pipeline of response.data ?? []) {
		for (const stage of pipeline.stages ?? []) {
			const mark = stage.is_won ? ' (won)' : stage.is_lost ? ' (lost)' : '';
			options.push({ name: `${pipeline.name} › ${stage.name}${mark}`, value: stage.id });
		}
	}
	return options;
}

/** Active team members (needs the API permission users:read). "Nobody" removes the assignee. */
export async function getUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = (await theYCrmApiRequest.call(this, 'GET', '/users')) as { data?: User[] };
	const users = (response.data ?? []).map((user) => ({
		name: user.email && user.email !== user.name ? `${user.name} (${user.email})` : user.name,
		value: user.id,
	}));
	return [{ name: 'Nobody (Remove Assignee)', value: 'none' }, ...users];
}
