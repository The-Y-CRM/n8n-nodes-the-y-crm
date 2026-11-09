# n8n-nodes-the-y-crm

This is an n8n community node. It lets you use [The-Y CRM](https://the-y.at/en/crm/) in your n8n workflows.

The-Y CRM is a shared inbox for WhatsApp, email, web chat and phone with contacts, deals and flows. It runs in the hosted cloud (crm.the-y.at) or on your own server.

This package contains two nodes:

- **The-Y CRM**: create, get, search and update contacts.
- **The-Y CRM Trigger**: start a workflow when The-Y CRM sends an event, for example a new message, a new conversation, a new or changed contact, or a changed deal stage.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) ·
[Credentials](#credentials) ·
[Operations](#operations) ·
[Trigger setup](#trigger-setup) ·
[Example workflows](#example-workflows) ·
[Compatibility](#compatibility) ·
[Limitations](#limitations) ·
[Resources](#resources) ·
[License](#license)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In short: in n8n go to **Settings → Community Nodes → Install**, enter `n8n-nodes-the-y-crm` and confirm.

## Credentials

You need an API key from The-Y CRM.

1. In The-Y CRM open **Settings → Integrations → API keys** and create a new key.
2. Give the key the permissions **contacts:read** and **contacts:write**. Optionally set an expiry date.
3. Copy the key. It starts with `tyk_` and is shown only once.
4. In n8n create a new credential **The-Y CRM API**:
   - **Base URL**: keep `https://crm.the-y.at` for the hosted cloud. If you host The-Y CRM yourself, enter your own address, for example `https://crm.example.com`.
   - **API Key**: paste the key.
5. Click **Save**. n8n tests the connection right away.

The key is sent as `Authorization: Bearer <key>` to `<Base URL>/api/ext/v1`. Treat it like a password.

## Operations

### Contact

| Operation | What it does |
|---|---|
| **Create** | Creates a contact with email, first name, last name, phone and custom fields. |
| **Get** | Returns one contact, including its custom fields. Pick the contact from a list, paste its URL from The-Y CRM, or enter its ID. |
| **Get Many** | Returns contacts, newest first. Optional search over name, email, phone and company. Supports **Return All**. |
| **Update** | Changes only the fields you add. Email and phone replace the contact's first address or number, the others stay. |

**Custom fields:** use the field key, for example `customer_number`. You find the keys in The-Y CRM under **Settings → Custom fields**. Unknown keys are ignored by The-Y CRM.

The node can also be used as a tool by AI agents in n8n.

## Trigger setup

The-Y CRM cannot register webhooks automatically yet. You copy the webhook URL of the trigger node into The-Y CRM once. There are two ways, depending on the event.

First, add the **The-Y CRM Trigger** node to a workflow, choose the events under **Trigger On** and copy the **Production URL** from the top of the node. (For a quick test you can use the Test URL and click **Listen for test event**.)

### Contact events (signed)

Events: **Contact Created**, **Contact Updated**.

1. In The-Y CRM open **Settings → Integrations → Send data (webhook) → + Webhook**.
2. Paste the Production URL and select `contact.created` and/or `contact.updated`.
3. The-Y CRM shows a signing secret (`whsec_…`) once. Copy it into the trigger node under **Options → Signing Secret**.

With a signing secret, the node checks the `X-TheY-Signature` header (HMAC-SHA256 over timestamp and body) and rejects deliveries that are unsigned, changed or older than 5 minutes.

Example output:

```json
{
  "event": "contact.created",
  "tenant": "f7139d51-…",
  "at": "2026-11-09T20:34:05.423Z",
  "data": {
    "id": "49dae377-…",
    "name": "Maria Muster",
    "emails": [{ "type": "work", "value": "maria@example.com" }],
    "phones": [{ "type": "mobile", "value": "+4366012345678" }]
  },
  "deliveryId": "0ec3909d-…"
}
```

`contact.updated` contains `id` and `name`. Use the **The-Y CRM → Contact → Get** operation for all fields.

### All other events (flows)

Events: **Message Received**, **Conversation Started**, **Conversation Assigned**, **Conversation Closed**, **Deal Created**, **Deal Stage Changed**, **Deal Won**, **Deal Lost**.

For each event, create a flow in The-Y CRM:

1. Open **Flows → New flow** and choose the trigger from the table below.
2. Add the action **Send data (webhook)**.
3. **Address (URL)**: paste the Production URL of the trigger node.
4. **Custom content (JSON, optional)**: paste the JSON body from the table below.
5. Save and switch the flow on.

Flow webhooks are not signed. Leave **Signing Secret** empty in a trigger node that receives flow events. If you also want contact events with signature checks, use a second trigger node.

| Event in n8n | Flow trigger in The-Y CRM | JSON body |
|---|---|---|
| Message Received | Customer writes (every message) | [Conversation body](#conversation-body) with `"event": "message.received"` |
| Conversation Started | Customer writes, tick **Only for the first message of a conversation** | [Conversation body](#conversation-body) with `"event": "conversation.started"` |
| Conversation Assigned | Conversation assigned | [Conversation body](#conversation-body) with `"event": "conversation.assigned"` |
| Conversation Closed | Conversation closed | [Conversation body](#conversation-body) with `"event": "conversation.closed"` |
| Deal Created | Deal created | [Deal body](#deal-body) with `"event": "deal.created"` |
| Deal Stage Changed | Deal stage changed | [Deal body](#deal-body) with `"event": "deal.stage_changed"` |
| Deal Won | Deal won | [Deal body](#deal-body) with `"event": "deal.won"` |
| Deal Lost | Deal lost | [Deal body](#deal-body) with `"event": "deal.lost"` |

#### Conversation body

```json
{
  "event": "message.received",
  "conversation_id": "{{conversation.id}}",
  "channel": "{{conversation.channel}}",
  "status": "{{conversation.status}}",
  "assignee_id": "{{conversation.assignee_id}}",
  "first_message": "{{message.first}}",
  "text": "{{message.body}}",
  "contact_id": "{{contact.id}}",
  "contact_name": "{{contact.name}}",
  "contact_email": "{{contact.email}}",
  "contact_phone": "{{contact.phone}}"
}
```

#### Deal body

```json
{
  "event": "deal.stage_changed",
  "deal_id": "{{deal.id}}",
  "title": "{{deal.title}}",
  "value": "{{deal.value}}",
  "status": "{{deal.status}}",
  "stage": "{{deal.stage_name}}",
  "pipeline": "{{deal.pipeline_name}}",
  "contact_id": "{{contact.id}}",
  "contact_name": "{{contact.name}}"
}
```

You can add or remove fields. Keep the `event` field, because the node uses it for **Trigger On**. All values arrive as text.

Example output for a new web chat message:

```json
{
  "tenant": "f7139d51-…",
  "at": "2026-11-09T20:34:07.371Z",
  "data": {
    "event": "message.received",
    "conversation_id": "a91826e1-…",
    "channel": "webchat",
    "first_message": "true",
    "text": "Hello, do you have time on Friday?",
    "contact_id": "827ad37a-…",
    "contact_name": "Web visitor",
    "contact_email": "",
    "contact_phone": ""
  },
  "event": "message.received"
}
```

### Good to know

- Deliveries for events that are not selected under **Trigger On** are answered with HTTP 200 and ignored.
- The-Y CRM waits up to 8 seconds for an answer and retries on errors or timeouts. Retries of signed webhooks keep the same `deliveryId`, so you can remove duplicates.
- After 50 failed deliveries in a row, The-Y CRM pauses a signed webhook. To resume, delete it under **Settings → Integrations** and create it again with a new signing secret.
- If you host The-Y CRM yourself and n8n runs in your own network, set `WEBHOOK_PRIVATE_TARGETS=on` in The-Y CRM. Otherwise The-Y CRM only sends to public addresses.

## Example workflows

**New web chat message → task in another tool**

1. **The-Y CRM Trigger**, Trigger On: Message Received (flow "Customer writes" as described above).
2. **The-Y CRM → Contact → Get**, Contact: By ID, `{{ $json.data.contact_id }}`.
3. Any node of your choice, for example a ticket or chat tool, with the message text `{{ $('The-Y CRM Trigger').item.json.data.text }}`.

**Form submission → contact in The-Y CRM**

1. **n8n Form Trigger** (or any other source) with email, first name and last name.
2. **The-Y CRM → Contact → Get Many**, Filters → Search: the email address, Limit 1.
3. **If** no contact was found: **The-Y CRM → Contact → Create**. Otherwise: **The-Y CRM → Contact → Update**.

**New contact → newsletter tool**

1. **The-Y CRM Trigger**, Trigger On: Contact Created, with Signing Secret.
2. **The-Y CRM → Contact → Get**, Contact: By ID, `{{ $json.data.id }}`.
3. Your newsletter tool. Only add people who agreed to receive it.

## Compatibility

- Tested with n8n 2.46.7 and The-Y CRM 1.1.61 (self-hosted and cloud use the same API).
- Requires a The-Y CRM API key (available on all plans, with a rate limit of 300 requests per minute).

## Limitations

The public API of The-Y CRM currently covers contacts. Conversations, messages, deals, tasks and notes are not available through the API yet, so this node cannot send messages or create deals, tasks or notes. You can still react to these events with the trigger and flows. More operations will follow when the API grows.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [The-Y CRM REST API](https://the-y.at/en/docs/api/)
- [The-Y CRM](https://the-y.at/en/crm/)
- Questions and bugs: [GitHub issues](https://github.com/theyat/n8n-nodes-the-y-crm/issues) or office@the-y.at

## License

The code in this package is licensed under the [MIT License](LICENSE.md). © 2026 The-Y e.U.

The-Y CRM itself is proprietary software of The-Y e.U. and is not covered by this license.
