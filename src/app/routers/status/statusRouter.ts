import express from "express";
import { EC2, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

const router = express.Router();

const ec2Client = new EC2({
  region: "us-east-1",
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

router.get("/get", async (req, res) => {
  try {
    const data = await ec2Client.send(new DescribeInstancesCommand({}));
    let instanceInfos: any = [];
    data?.Reservations?.forEach((reservation) =>
      reservation?.Instances?.forEach((instance) => {
        instanceInfos.push({
          InstanceId: instance.InstanceId,
          InstanceType: instance.InstanceType,
          State: instance?.State?.Name,
          LaunchTime: instance.LaunchTime,
        });
      })
    );
    console.log(instanceInfos);
  } catch (err) {
    console.error(err);
  }
});

export default router;
