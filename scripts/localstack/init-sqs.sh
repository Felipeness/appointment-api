#!/bin/bash

echo "Creating SQS queue for appointments..."

awslocal sqs create-queue \
  --queue-name appointment-queue \
  --attributes VisibilityTimeoutSeconds=60,MessageRetentionPeriod=1209600

echo "SQS queue created successfully!"

awslocal sqs list-queues