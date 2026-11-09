import {
	NodeConnectionTypes,
	NodeApiError,
	type IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type JsonObject,
} from 'n8n-workflow';
import { verifyTheYSignature } from './signature';
import { theYCrmApiRequest } from '../TheYCrm/shared/transport';

const ANY_EVENT = '*';
/** Test delivery of The-Y CRM ("Send again" and the hourly probe of a paused webhook). Answered, never starts the workflow. */
export const PING_EVENT = 'webhook.ping';

/** Event name of a delivery: header of a signed webhook, `event` in the body, or `event` inside `data` (flow webhooks). */
function detectEvent(body: IDataObject, headers: IDataObject): string {
	const fromHeader = headers['x-they-event'];
	if (typeof fromHeader === 'string' && fromHeader) return fromHeader;
	if (typeof body.event === 'string' && body.event) return body.event;
	const data = body.data as IDataObject | undefined;
	if (data && typeof data === 'object' && typeof data.event === 'string') return data.event;
	return '';
}

type StaticData = { webhookId?: string; webhookSecret?: string; webhookUrl?: string };

export class TheYCrmTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'The-Y CRM Trigger',
		name: 'theYCrmTrigger',
		icon: { light: 'file:../../icons/the-y.svg', dark: 'file:../../icons/the-y.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{"On: " + ($parameter["events"] || []).join(", ")}}',
		description:
			'Starts the workflow when The-Y CRM sends an event, for example a new message, a new contact or a changed deal stage',
		defaults: {
			name: 'The-Y CRM Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'theYCrmApi',
				required: true,
				displayOptions: { show: { registration: ['automatic'] } },
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Registration',
				name: 'registration',
				type: 'options',
				default: 'automatic',
				options: [
					{
						name: 'Automatic (Recommended)',
						value: 'automatic',
						description:
							'The node registers its webhook in The-Y CRM when the workflow is activated and removes it when it is deactivated. The API key needs the permission webhooks:manage.',
					},
					{
						name: 'Manual',
						value: 'manual',
						description:
							'You copy the webhook URL above into The-Y CRM yourself (Settings → Integrations, or a flow action "Send data (webhook)")',
					},
				],
			},
			{
				displayName:
					'Copy the webhook URL above into The-Y CRM under Settings → Integrations → Send data (webhook), or use it in a flow action "Send data (webhook)". Put the secret The-Y CRM shows once into "Signing Secret" below.',
				name: 'manualNotice',
				type: 'notice',
				default: '',
				displayOptions: { show: { registration: ['manual'] } },
			},
			{
				displayName: 'Trigger On',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [ANY_EVENT],
				description:
					'The events that start the workflow. Other deliveries are accepted and ignored.',
				options: [
					{ name: 'Any Event', value: ANY_EVENT, description: 'Every event from The-Y CRM' },
					{
						name: 'Contact Created',
						value: 'contact.created',
						description: 'From any source: form, API, WhatsApp, email, calls, bookings, import',
					},
					{ name: 'Contact Updated', value: 'contact.updated' },
					{ name: 'Conversation Assigned', value: 'conversation.assigned' },
					{ name: 'Conversation Closed', value: 'conversation.closed' },
					{
						name: 'Conversation Created',
						value: 'conversation.created',
						description: 'A customer or the team starts a new conversation',
					},
					{ name: 'Deal Created', value: 'deal.created' },
					{ name: 'Deal Lost', value: 'deal.lost' },
					{ name: 'Deal Stage Changed', value: 'deal.stage_changed' },
					{ name: 'Deal Won', value: 'deal.won' },
					{
						name: 'Message Received',
						value: 'message.received',
						description: 'A customer writes (email, WhatsApp, SMS, web chat, …)',
					},
					{ name: 'Task Created', value: 'task.created' },
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Ignore Changes Made via the API',
						name: 'ignoreApi',
						type: 'boolean',
						default: false,
						description:
							'Whether to skip events caused by API calls (origin "api"), for example to avoid loops when the same workflow updates The-Y CRM',
					},
					{
						displayName: 'Signing Secret',
						name: 'signingSecret',
						type: 'string',
						typeOptions: { password: true },
						default: '',
						description:
							'Only for manual registration: the secret (whsec_…) that The-Y CRM shows once when you create a webhook. Deliveries without a valid signature are rejected. With automatic registration the node keeps the secret itself.',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				if (this.getNodeParameter('registration', 'automatic') !== 'automatic') return false;
				const data = this.getWorkflowStaticData('node') as StaticData;
				if (!data.webhookId) return false;
				try {
					const hook = (await theYCrmApiRequest.call(
						this,
						'GET',
						`/webhooks/${data.webhookId}`,
					)) as IDataObject;
					if (hook.url === this.getNodeWebhookUrl('default')) return true;
				} catch (error) {
					const status = Number((error as { httpCode?: string }).httpCode ?? 0);
					if (status !== 404) throw new NodeApiError(this.getNode(), error as JsonObject);
				}
				delete data.webhookId;
				delete data.webhookSecret;
				delete data.webhookUrl;
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				if (this.getNodeParameter('registration', 'automatic') !== 'automatic') return true;
				const url = this.getNodeWebhookUrl('default') as string;
				const events = this.getNodeParameter('events', [ANY_EVENT]) as string[];
				const workflow = this.getWorkflow();
				let response: IDataObject;
				try {
					response = (await theYCrmApiRequest.call(
						this,
						'POST',
						'/webhooks',
						{},
						{
							url,
							events: events.includes(ANY_EVENT) ? [ANY_EVENT] : events,
							name: `n8n: ${workflow.name ?? workflow.id ?? 'workflow'}`.slice(0, 100),
						},
					)) as IDataObject;
				} catch (error) {
					throw new NodeApiError(this.getNode(), error as JsonObject, {
						message: 'The-Y CRM did not accept the webhook',
						description:
							'Check that the API key has the permission webhooks:manage and that The-Y CRM can reach the n8n webhook URL (for a self-hosted CRM: WEBHOOK_PRIVATE_TARGETS=on for addresses in your own network).',
					});
				}
				const data = this.getWorkflowStaticData('node') as StaticData;
				data.webhookId = String(response.id);
				data.webhookSecret = String(response.secret);
				data.webhookUrl = url;
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node') as StaticData;
				if (this.getNodeParameter('registration', 'automatic') !== 'automatic' || !data.webhookId)
					return true;
				try {
					await theYCrmApiRequest.call(this, 'DELETE', `/webhooks/${data.webhookId}`);
				} catch (error) {
					const status = Number((error as { httpCode?: string }).httpCode ?? 0);
					if (status !== 404) return false;
				}
				delete data.webhookId;
				delete data.webhookSecret;
				delete data.webhookUrl;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		const headers = this.getHeaderData() as IDataObject;
		const events = this.getNodeParameter('events', [ANY_EVENT]) as string[];
		const options = this.getNodeParameter('options', {}) as {
			signingSecret?: string;
			ignoreApi?: boolean;
		};
		const data = this.getWorkflowStaticData('node') as StaticData;
		const secret = data.webhookSecret || options.signingSecret || '';

		if (secret) {
			const request = this.getRequestObject() as unknown as { rawBody?: Buffer };
			const rawBody = request.rawBody ? request.rawBody.toString('utf8') : JSON.stringify(body);
			const valid = verifyTheYSignature(
				secret,
				headers['x-they-signature'],
				headers['x-they-timestamp'],
				rawBody,
				Math.floor(Date.now() / 1000),
			);
			if (!valid) {
				const response = this.getResponseObject();
				response.status(401).json({ error: 'invalid_signature' });
				return { noWebhookResponse: true };
			}
		}

		const event = detectEvent(body, headers);
		// Test delivery of The-Y CRM: confirm it, never start the workflow
		if (event === PING_EVENT) {
			return { webhookResponse: { received: true, ping: true } };
		}
		if (!events.includes(ANY_EVENT) && !events.includes(event)) {
			return { webhookResponse: { received: true, ignored: true } };
		}
		const payload = body.data as IDataObject | undefined;
		if (options.ignoreApi && payload && payload.origin === 'api') {
			return { webhookResponse: { received: true, ignored: true } };
		}

		const output: IDataObject = { ...body };
		if (output.event === undefined && event) output.event = event;
		const eventId = headers['x-they-event-id'];
		if (typeof eventId === 'string' && output.eventId === undefined) output.eventId = eventId;
		const deliveryId = headers['x-they-delivery'];
		if (typeof deliveryId === 'string' && output.deliveryId === undefined)
			output.deliveryId = deliveryId;

		return {
			workflowData: [this.helpers.returnJsonArray(output)],
		};
	}
}
