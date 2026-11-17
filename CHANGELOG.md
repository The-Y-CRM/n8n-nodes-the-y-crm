# Changelog

All notable changes to this package are documented in this file.

## 0.2.1

No code changes.

### Changed

- Releases are now published from GitHub Actions via npm trusted publishing (OpenID Connect) with provenance. No access token is stored in the repository.
- README: npm version badge.

## 0.2.0

Needs The-Y CRM 1.1.62 or newer (new API).

### Added

- Credential: **Environment** — The-Y Cloud (crm.the-y.at) or Self-Hosted (own URL). The connection test works with every valid key (`GET /me`). Credentials from 0.1.0 keep their saved base URL.
- Contact: **Create or Update** (by email address, no duplicates).
- Resource **Conversation**: Get (with messages), Get Many (status, channel, since, contact), Send Message (same channel and account as the conversation, WhatsApp templates outside the 24-hour window), Update (status, assignee).
- Resource **Deal**: Create, Get, Update (stage from a list of all pipeline stages).
- Resource **Task**: Create. Resource **Note**: Create (contact, company, deal, or internal note in a conversation).
- Trigger: **automatic registration** of the signed webhook via the API when the workflow is activated, removal when it is deactivated; the node keeps the signing secret. New events: conversation created, task created; all events are now signed and come straight from The-Y CRM (no flow needed). `webhook.ping` is answered and never starts the workflow. Option **Ignore Changes Made via the API**. Output contains `eventId` (same on retries).

### Changed

- Trigger: event **Conversation Started** (flow-based) is replaced by **Conversation Created**. Manual registration and flow webhooks still work (Registration: Manual).

## 0.1.0

First version.

### Added

- Credential **The-Y CRM API**: base URL (hosted cloud or your own server) and API key, with a connection test.
- Node **The-Y CRM**, resource **Contact**: Create, Get, Get Many (search, Return All) and Update, including custom fields. Contacts can be picked from a list, by URL or by ID. Usable as a tool for AI agents.
- Node **The-Y CRM Trigger**: starts workflows on contact events (signed integration webhooks, signature and age check) and on events sent by The-Y CRM flows (message received, conversation started, assigned and closed, deal created, stage changed, won and lost). Filter by event under **Trigger On**.
