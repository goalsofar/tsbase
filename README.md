# Deploy manager

Deploy manager manages the pipeline.

gcloud pubsub subscriptions create debug-subscription --topic=clouddeploy-operations

gcloud pubsub subscriptions pull debug-subscription --auto-ack
gcloud pubsub subscriptions pull debug-subscription --format json --limit 1

## Deploying function

`npm run deploy`

## Testing locally

`npx functions-framework --target=coordinatePipeline`
