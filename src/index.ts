import * as functions from "@google-cloud/functions-framework";
import { PubSub } from "@google-cloud/pubsub";

interface ICloudDeployOperationsEvent {
  message: {
    attributes: {
      Action: string;
      DeliveryPipelineId: string;
      Location: string;
      ProjectNumber: string;
      ReleaseId: string;
      Resource: string;
      ResourceType: string;
      RolloutId: string;
      TargetId: string;
    };
  };
}

const SUCCEED_ACTION = "Succeed";
const ROLLOUT = "Rollout";
const FRONTEND_DEPLOY_TOPIC = "frontend-deploy";

const isRolloutSuccess = (
  attributes: ICloudDeployOperationsEvent["message"]["attributes"] | undefined
) =>
  attributes &&
  attributes.Action === SUCCEED_ACTION &&
  attributes.ResourceType === ROLLOUT;

const parseTargetProjectId = (targetId: string) =>
  `storyzen-${targetId.split("-")[1]}`;

const parseCommitSHA = (releaseId: string) => releaseId.split("-")[1];

const handleRolloutSuccess = async (
  attributes: ICloudDeployOperationsEvent["message"]["attributes"]
) => {
  const projectId = parseTargetProjectId(attributes.TargetId);
  const commitSHA = parseCommitSHA(attributes.ReleaseId);
  console.log(
    `Deploying frontend, target project ${projectId} with commitSHA ${commitSHA}`
  );

  const data = JSON.stringify({ projectId, commitSHA });
  const pubsub = new PubSub();

  try {
    const messageId = await pubsub
      .topic(FRONTEND_DEPLOY_TOPIC)
      .publishMessage({ data: Buffer.from(data) });
    console.log(`Message ${messageId} published.`);
  } catch (error) {
    console.error(`Error publishing message: ${error}`);
  }
};

functions.cloudEvent<ICloudDeployOperationsEvent>(
  "coordinatePipeline",
  async (cloudEvent) => {
    const attributes = cloudEvent.data?.message?.attributes;
    if (attributes) {
      if (isRolloutSuccess(attributes)) {
        console.log(
          `Rollout success, release ${attributes.ReleaseId} succeeded to ${attributes.TargetId}`
        );
        handleRolloutSuccess(attributes);
      }
    } else {
      console.log("DeployOperations event witout attributes", cloudEvent);
    }
  }
);
