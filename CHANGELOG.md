# Changelog

All notable changes to this package are documented in this file.

## 0.1.0

First version.

### Added

- Credential **The-Y CRM API**: base URL (hosted cloud or your own server) and API key, with a connection test.
- Node **The-Y CRM**, resource **Contact**: Create, Get, Get Many (search, Return All) and Update, including custom fields. Contacts can be picked from a list, by URL or by ID. Usable as a tool for AI agents.
- Node **The-Y CRM Trigger**: starts workflows on contact events (signed integration webhooks, signature and age check) and on events sent by The-Y CRM flows (message received, conversation started, assigned and closed, deal created, stage changed, won and lost). Filter by event under **Trigger On**.
