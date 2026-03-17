# AidLine MySQL Database

This directory contains a MySQL-first schema for AidLine's **non-location** interaction model.

## What changed

- No GPS, coordinates, or proximity matching.
- Requests are handled through:
  1. request intake
  2. AI triage
  3. service routing
  4. responder acceptance
  5. secure messaging
  6. resolution + analytics

## Files

- `schema.sql`: full DDL for MySQL 8.
- `seed.sql`: sample organizations, requests, routes, and secure messages.

## Apply schema

```bash
mysql -u <user> -p < mysql/schema.sql
mysql -u <user> -p < mysql/seed.sql
```

## Core tables

- `aid_requests`: centralized request intake.
- `triage_results`: category/priority/responder output.
- `request_routes`: module routing and acceptance status.
- `secure_conversations` and `secure_messages`: encrypted coordination channel.
- `daily_crisis_metrics`: institutional analytics without personal location data.
