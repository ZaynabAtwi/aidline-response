# AidLine MySQL schema

This directory contains a MySQL 8 schema for the request-routing version of AidLine.

## Files

- `001_request_routing_schema.sql` - core schema, indexes, seed networks, and analytics views

## What changed

The MySQL model is intentionally not location-aware. It replaces geographic entities and routing with:

- structured request intake
- AI triage metadata
- service-network routing
- responder assignments
- secure conversations
- medication inventory tracking
- analytics views for institutions

## Import

```bash
mysql -u root -p < database/mysql/001_request_routing_schema.sql
```

Use an empty MySQL 8 database with InnoDB and `utf8mb4`.
