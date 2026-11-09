import {
	NodeConnectionTypes,
	type IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';
import { verifyTheYSignature } from './signature';

const ANY_EVENT = '*';

/** Event name of a delivery: header of a signed webhook, `event` in the body, or `event` inside `data` (flows). */
function detectEvent(body: IDataObject, headers: IDataObject): string {
	const fromHeader = headers['x-they-event'];
	if (typeof fromHeader === 'string' && fromHeader) return fromHeader;
	if (typeof body.event === 'string' && body.event) return body.event;
	const data = body.data as IDataObject | undefined;
	if (data && typeof data === 'object' && typeof data.event === 'string') return data.event;
	return '';
}

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
				displayName:
					'The-Y CRM cannot register webhooks automatically yet. Copy the webhook URL above into The-Y CRM: contact events under Settings → Integrations → Send data (webhook), all other events with a flow that uses the action "Send data (webhook)". The README has a ready-made JSON body for every event.',
				name: 'setupNotice',
				type: 'notice',
				default: '',
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
					{
						name: 'Any Event',
						value: ANY_EVENT,
						description: 'Every delivery from The-Y CRM',
					},
					{
						name: 'Contact Created',
						value: 'contact.created',
						description: 'Integration webhook, signed',
					},
					{
						name: 'Contact Updated',
						value: 'contact.updated',
						description: 'Integration webhook, signed',
					},
					{
						name: 'Conversation Assigned',
						value: 'conversation.assigned',
						description: 'Flow "Conversation assigned" with the action "Send data (webhook)"',
					},
					{
						name: 'Conversation Closed',
						value: 'conversation.closed',
						description: 'Flow "Conversation closed" with the action "Send data (webhook)"',
					},
					{
						name: 'Conversation Started',
						value: 'conversation.started',
						description:
							'Flow "Customer writes" with "Only for the first message of a conversation" and the action "Send data (webhook)"',
					},
					{
						name: 'Deal Created',
						value: 'deal.created',
						description: 'Flow "Deal created" with the action "Send data (webhook)"',
					},
					{
						name: 'Deal Lost',
						value: 'deal.lost',
						description: 'Flow "Deal lost" with the action "Send data (webhook)"',
					},
					{
						name: 'Deal Stage Changed',
						value: 'deal.stage_changed',
						description: 'Flow "Deal stage changed" with the action "Send data (webhook)"',
					},
					{
						name: 'Deal Won',
						value: 'deal.won',
						description: 'Flow "Deal won" with the action "Send data (webhook)"',
					},
					{
						name: 'Message Received',
						value: 'message.received',
						description: 'Flow "Customer writes" with the action "Send data (webhook)"',
					},
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
						displayName: 'Signing Secret',
						name: 'signingSecret',
						type: 'string',
						typeOptions: { password: true },
						default: '',
						description:
							'The secret (whsec_…) that The-Y CRM shows once when you create a webhook under Settings → Integrations. When set, deliveries without a valid signature are rejected. Flow webhooks are not signed, so leave this empty for flow events.',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			// The-Y CRM has no API to register webhooks yet. The user adds the URL in The-Y CRM
			// (see the notice in the node), so there is nothing to check, create or delete remotely.
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		const headers = this.getHeaderData() as IDataObject;
		const events = this.getNodeParameter('events', [ANY_EVENT]) as string[];
		const options = this.getNodeParameter('options', {}) as { signingSecret?: string };

		if (options.signingSecret) {
			const request = this.getRequestObject() as unknown as { rawBody?: Buffer };
			const rawBody = request.rawBody ? request.rawBody.toString('utf8') : JSON.stringify(body);
			const valid = verifyTheYSignature(
				options.signingSecret,
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
		if (!events.includes(ANY_EVENT) && !events.includes(event)) {
			return { webhookResponse: { received: true, ignored: true } };
		}

		const output: IDataObject = { ...body };
		if (output.event === undefined && event) output.event = event;
		const deliveryId = headers['x-they-delivery'];
		if (typeof deliveryId === 'string' && output.deliveryId === undefined) {
			output.deliveryId = deliveryId;
		}

		return {
			workflowData: [this.helpers.returnJsonArray(output)],
		};
	}
}
