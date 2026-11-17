# n8n-nodes-the-y-crm

This is an n8n community node. It lets you use [The-Y CRM](https://the-y.at/en/crm/) in your n8n workflows.

The-Y CRM is a shared inbox for WhatsApp, email, web chat and phone with contacts, deals and flows. It runs in the hosted cloud (crm.the-y.at) or on your own server.

This package contains two nodes:

- **The-Y CRM**: contacts (create, create or update, get, search, update), conversations (get, list, send a message, change status or assignee), deals (create, get, change stage), tasks and notes.
- **The-Y CRM Trigger**: start a workflow when something happens in The-Y CRM, for example a new message, a new conversation, a new or changed contact, a changed deal stage or a new task. The trigger registers itself in The-Y CRM and checks the signature of every delivery.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) ·
[Credentials](#credentials) ·
[Your own n8n with your own The-Y CRM](#your-own-n8n-with-your-own-the-y-crm) ·
[Operations](#operations) ·
[Trigger](#trigger) ·
[Example workflows](#example-workflows) ·
[Compatibility](#compatibility) ·
[Limitations](#limitations) ·
[Resources](#resources) ·
[License](#license)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

- **Self-hosted n8n:** go to **Settings → Community Nodes → Install**, enter `n8n-nodes-the-y-crm` and confirm. You can use the node right away.
- **n8n Cloud:** n8n Cloud only offers community nodes that n8n has verified. Until this package is verified, it is not available in n8n Cloud. Use a self-hosted n8n in the meantime.

## Credentials

You need an API key from The-Y CRM.

1. In The-Y CRM open **Settings → Integrations → API keys** and create a new key.
2. Give the key the permissions your workflows need (see the table below). Optionally set an expiry date.
3. Copy the key. It starts with `tyk_` and is shown only once.
4. In n8n create a new credential **The-Y CRM API**:
   - **Environment**: **The-Y Cloud (crm.the-y.at)** if you use the hosted cloud, or **Self-Hosted (Own URL)** if The-Y CRM runs on your own server.
   - **Base URL** (only self-hosted): the address of your The-Y CRM, for example `https://crm.example.com`.
   - **API Key**: paste the key.
5. Click **Save**. n8n tests the connection right away (this works with every valid key, whatever its permissions).

| Permission                                   | Needed for                                                            |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `contacts:read` / `contacts:write`           | Contact operations                                                    |
| `conversations:read` / `conversations:write` | Get and list conversations / send messages, change status or assignee |
| `deals:read` / `deals:write`                 | Get deals, list pipelines and stages / create and update deals        |
| `tasks:write`                                | Create tasks                                                          |
| `notes:write`                                | Create notes                                                          |
| `users:read`                                 | Pick an assignee from a list                                          |
| `webhooks:manage`                            | **Trigger** with automatic registration                               |

The key is sent as `Authorization: Bearer <key>` to `<Base URL>/api/ext/v1`. Treat it like a password.

Credentials created with version 0.1.0 keep working: they still use their saved base URL.

## Your own n8n with your own The-Y CRM

If both run on your own servers:

- **n8n must reach The-Y CRM** at the base URL you enter in the credential (for all actions of the The-Y CRM node).
- **For the trigger, The-Y CRM must reach n8n** at the webhook URL n8n shows in the trigger node. If n8n runs in your own network (for example `http://192.168.1.20:5678`), set `WEBHOOK_PRIVATE_TARGETS=on` in the `.env` of The-Y CRM. Without it, The-Y CRM only sends to public addresses (protection against requests into internal networks). Loopback addresses (`localhost`, `127.0.0.1`) are never allowed — use the address of the host or container.
- If n8n sits behind a reverse proxy, set `WEBHOOK_URL` in n8n to the address The-Y CRM should call.

## Operations

### Contact

| Operation            | What it does                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Create**           | Creates a contact with email, first name, last name, phone and custom fields.                                                                 |
| **Create or Update** | Updates the contact with this email address, or creates it if there is none. No duplicates, even if the workflow runs twice at the same time. |
| **Get**              | Returns one contact, including its custom fields. Pick the contact from a list, paste its URL from The-Y CRM, or enter its ID.                |
| **Get Many**         | Returns contacts, newest first. Optional search over name, email, phone and company. Supports **Return All**.                                 |
| **Update**           | Changes only the fields you add. Email and phone replace the contact's first address or number, the others stay.                              |

**Custom fields:** use the field key, for example `customer_number`. The API lists the keys under `GET /custom-fields?entity=contact`; in The-Y CRM you find them under **Settings → Custom fields**. Unknown keys are not saved; the response then contains a `warnings` entry.

### Conversation

| Operation        | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Get**          | One conversation with its latest messages (customer messages `direction: in`, replies `out`, internal notes `internal: true`).                                                                                                                                                                                                                                                                                                                                               |
| **Get Many**     | Conversations, newest activity first. Filters: status, channel, since, contact. Supports **Return All**.                                                                                                                                                                                                                                                                                                                                                                     |
| **Send Message** | Replies on the conversation's own channel and account: email (with signature, subject `Re:` and quote), WhatsApp, SMS, Messenger, Instagram or web chat. On WhatsApp outside the 24-hour window only an approved template works (**Use WhatsApp Template**). The-Y CRM applies the same rules as its automatic replies: a contact who opted out of a channel gets nothing, marketing templates need explicit consent. The message appears in the inbox as "API: <key name>". |
| **Update**       | Status (open, closed, snoozed until a date) and assignee. Closing works like in the inbox (satisfaction survey if switched on).                                                                                                                                                                                                                                                                                                                                              |

### Deal

| Operation  | What it does                                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Create** | Title, value, currency, stage, contact, company, expected close date, custom fields. Without a stage the deal starts in the first stage of the default pipeline. |
| **Get**    | One deal with pipeline, stage and custom fields.                                                                                                                 |
| **Update** | Change the stage (the pipeline follows the stage; won or lost follow from the stage) or other fields.                                                            |

Pick the stage from the list (needs `deals:read`).

### Task and Note

- **Task → Create**: title, description, due date, priority, type (to-do, callback, call, email, follow-up), assignee, linked contact, company, deal or conversation. The task belongs to the person who created the API key.
- **Note → Create**: a note in the timeline of a contact, company or deal, or an internal note in a conversation (never sent to the customer).

The node can also be used as a tool by AI agents in n8n.

## Trigger

### Automatic registration (recommended)

1. Add **The-Y CRM Trigger**, choose the credential (the key needs `webhooks:manage`) and the events under **Trigger On**.
2. Activate the workflow. The node registers its webhook in The-Y CRM (you see it under **Settings → Integrations → Send data (webhook)** as "n8n: <workflow name>") and keeps the signing secret. Every delivery is checked; deliveries without a valid signature or older than 5 minutes are rejected with HTTP 401.
3. Deactivating the workflow removes the webhook in The-Y CRM again.

**Manual registration** (for flow webhooks or keys without `webhooks:manage`): set **Registration** to **Manual**, copy the webhook URL into The-Y CRM and put the secret The-Y CRM shows once into **Options → Signing Secret**.

### Events

| Event                                                            | When                                                                                                                                                                                                                              |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contact.created`                                                | A contact is created — by hand, via the API, from WhatsApp, email, SMS, calls, web chat, bookings or appointments, and from imports with the box "Run automations … and webhooks" ticked. `data.source` tells where it came from. |
| `contact.updated`                                                | A contact is changed in the form, the inbox or via the API. `data.changed` lists the changed fields.                                                                                                                              |
| `message.received`                                               | A customer writes. `data.text`, `data.channel`, `data.conversation_id`, `data.contact_id`, `data.from`.                                                                                                                           |
| `conversation.created`                                           | A customer starts a new conversation, or the team starts one. `data.started_by`: `customer` or `team`.                                                                                                                            |
| `conversation.closed` / `conversation.assigned`                  | Status closed / new assignee (`data.assignee`).                                                                                                                                                                                   |
| `deal.created` / `deal.stage_changed` / `deal.won` / `deal.lost` | Deals, with `from_stage` / `to_stage` on stage changes.                                                                                                                                                                           |
| `task.created`                                                   | A task is created.                                                                                                                                                                                                                |

Every delivery is a JSON object `{ id, event, tenant, at, data }`. `id` (also in the header `X-TheY-Event-Id`) stays the same on retries — use it to remove duplicates. `data.origin` says who caused the event: `customer`, `user`, `system`, `automation` or `api`. With **Options → Ignore Changes Made via the API** the trigger skips events with origin `api` (useful to avoid loops when the same workflow writes back to The-Y CRM).

The test delivery `webhook.ping` (sent when you click "Send again" in The-Y CRM, and every few hours to a paused webhook) is answered by the node and never starts the workflow.

### Good to know

- The-Y CRM waits up to 8 seconds for an answer, retries on errors or timeouts and sends at most 4 deliveries at the same time per webhook.
- After 50 failed deliveries in a row, The-Y CRM pauses the webhook, tells the admins and tries again every 6 hours. **Send again** under **Settings → Integrations** resumes it at once. Events that happen while a webhook is paused are not sent later.
- Message texts, names and phone numbers or email addresses go to your n8n. Only subscribe to the events you need.

## Example workflows

**Customer writes → AI reply**

1. **The-Y CRM Trigger**, Trigger On: Message Received, Options → Ignore Changes Made via the API.
2. An AI node of your choice with `{{ $json.data.text }}`.
3. **The-Y CRM → Conversation → Send Message**, Conversation: By ID `{{ $('The-Y CRM Trigger').item.json.data.conversation_id }}`, Text: the AI answer.

**Form submission → contact + task**

1. **n8n Form Trigger** with email, first name and last name.
2. **The-Y CRM → Contact → Create or Update** with the form values.
3. **The-Y CRM → Task → Create**, Title "Call back", Contact ID `{{ $json.id }}`, Type Callback.

**Deal won → invoice tool**

1. **The-Y CRM Trigger**, Trigger On: Deal Won.
2. Your invoice tool with `{{ $json.data.title }}` and `{{ $json.data.value }}` `{{ $json.data.currency }}`.

## Compatibility

- Tested with n8n 2.4.6 and The-Y CRM 1.1.62 (self-hosted; the cloud uses the same API).
- Requires a The-Y CRM API key (all plans). Limits per account: Free 60 requests per minute and 1,000 per day; Cloud Pro and paid licenses 300 per minute; self-hosted no limit per account. Above a limit The-Y CRM answers HTTP 429 with `Retry-After`.

## Limitations

- Sending files (attachments) and starting new conversations are not available through the API yet.
- Conversations that The-Y CRM itself starts with a message (phone system, flows) do not send `conversation.created`.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [The-Y CRM REST API](https://the-y.at/en/docs/api/)
- [The-Y CRM](https://the-y.at/en/crm/)
- Questions and bugs: [GitHub issues](https://github.com/The-Y-CRM/n8n-nodes-the-y-crm/issues) or office@the-y.at

## License

The code in this package is licensed under the [MIT License](LICENSE.md). © 2026 The-Y e.U.

The-Y CRM itself is proprietary software of The-Y e.U. and is not covered by this license.
