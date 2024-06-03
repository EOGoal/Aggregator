### EO Goal Aggregator

Sends data to a central spreadsheet per chapter.

Setup instructions are a work in progress

```bash

bunx wrangler queues create eo-goal-queue
bunx wrangler d1 create eo-goal-db
# Take note of database id and add to wrangler.toml
bunx wrangler d1 execute eo-goal-db --remote --file=./schema.sql

# Create secrets
bunx wrangler secret put GOOGLE_CLOUD_CREDENTIALS
bunx wrangler secret put SPREADSHEET_ID

bunx wrangler deploy
```
