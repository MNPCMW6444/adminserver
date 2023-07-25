import express from "express";
import { EC2, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

const router = express.Router();

const ec2Client = new EC2({
  region: "us-east-1",
  credentials: {
    accessKeyId: "AKIA6MGDYZ6MAU2NZXTS",
    secretAccessKey: "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",
  },
});

const getInstances = async () => {
  try {
    const data = await ec2Client.send(new DescribeInstancesCommand({}));
    let instanceInfos: {
      id: string;
      type: string;
      state: string;
      name: string;
    }[] = [];
    data?.Reservations?.forEach((reservation) =>
      reservation?.Instances?.forEach((instance) => {
        instanceInfos.push({
          id: instance.InstanceId + "",
          type: instance.InstanceType + "",
          state: instance?.State?.Name + "",
          name: instance?.Tags?.find((tag) => tag.Key === "Name")?.Value + "",
        });
      })
    );
    return instanceInfos;
  } catch (err) {
    return undefined;
  }
};

router.get("/all", async (_, res) => {
  return (await getInstances())
    ? res.status(200).json({ instances: await getInstances() })
    : res.status(500).json({ error: "Error getting instances" });
});

router.get("/running", async (_, res) => {
  const instances = await getInstances();
  return instances
    ? res.status(200).json({
        instances: instances.filter(({ state }) => state === "running"),
      })
    : res.status(500).json({ error: "Error getting instances" });
});

router.post("/startInstance", async (req, res) => {
  const instanceId = req.body.instanceId;

  const REGION = "us-east-1"; // replace with your region
  const ec2Client = new EC2({
    region: REGION,
    credentials: {
      accessKeyId: "AKIA6MGDYZ6MAU2NZXTS",
      secretAccessKey: "rtoMVRJ9aPch0/ArG6/XJTfsWdET3NLNxTTAp8kr",
    },
  });

  const params = {
    InstanceIds: [instanceId],
  };

  try {
    const data = await ec2Client.startInstances(params);
    console.log("Success", data.StartingInstances);
    res.send("Instance is starting");
  } catch (err) {
    console.log("Error", err);
    res.send("Error starting instance");
  }
});

router.post("/stopInstance", async (req, res) => {
  try {
    console.log("instanceId:");
    console.log(req.body);
    const instanceId = req.body.instanceId;
    console.log(instanceId);
    const REGION = "us-east-1"; // replace with your region
    const ec2Client = new EC2({
      region: REGION,
      credentials: {
        accessKeyId: "AKIA6MGDYZ6MAU2NZXTS",
        secretAccessKey: "rtoMVRJ9aPch0/ArG6/XJTfsWdET3NLNxTTAp8kr",
      },
    });

    const params = {
      InstanceIds: [instanceId],
    };

    const data = await ec2Client.stopInstances(params);
    console.log("Success", data.StoppingInstances);
    res.status(200).send("Instance is stopping");
  } catch (err) {
    // console.log("Error", err);
    res.status(500).json({ msg: err });
  }
});

export default router;
