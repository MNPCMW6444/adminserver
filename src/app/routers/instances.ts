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

    const params = {
      InstanceIds: [instanceId],
    };

    const data = await ec2Client.stopInstances(params);
    console.log("Success", data.StoppingInstances);
    res.status(200).send("Instance is stopping");
  } catch (err) {
    res.status(500).json({ msg: err });
  }
});

router.post("/launch", async (req, res) => {
  const { subdomain, password } = req.body;

  try {
    const securityGroupParams = {
      Description: "Security group for SSH and HTTPS",
      GroupName: `SSHAndHTTPS_${Date.now()}`,
      VpcId: "vpc-0c58fc34f99584ab7",
    };

    const createSGResponse = await ec2Client.createSecurityGroup(
      securityGroupParams
    );
    const groupId = createSGResponse.GroupId;

    if (!groupId) {
      throw new Error("Failed to create security group");
    }

    console.log("Security Group Created", groupId);

    const ingressParams = {
      GroupId: groupId,
      IpPermissions: [
        {
          IpProtocol: "tcp",
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{ CidrIp: "0.0.0.0/0" }],
        },
        {
          IpProtocol: "tcp",
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: "0.0.0.0/0" }],
        },
      ],
    };

    await ec2Client.authorizeSecurityGroupIngress(ingressParams);
    console.log("Ingress Successfully Set");

    const instanceParams = {
      ImageId: "ami-0331c28467b27651d",
      InstanceType: "t2.micro",
      SecurityGroupIds: [groupId],
      MinCount: 1,
      MaxCount: 1,
      KeyName: "admin",
      IamInstanceProfile: {
        Name: "devserverlauncher",
      },
      UserData: Buffer.from(
        `#!/bin/bash
/home/ubuntu/setup_script.sh ${password} ${subdomain}`
      ).toString("base64"),
      TagSpecifications: [
        {
          ResourceType: "instance",
          Tags: [
            {
              Key: "Name",
              Value: "dev-" + subdomain,
            },
          ],
        },
      ],
    };

    const instanceData = await ec2Client.runInstances(instanceParams);
    console.log("Success", instanceData);

    const instances = instanceData.Instances;
    if (!instances || instances.length === 0) {
      throw new Error("No instances were created");
    }

    const instanceId = instances[0].InstanceId;
    if (!instanceId) {
      throw new Error("Instance ID is undefined");
    }

    const tagParams = {
      Resources: [instanceId],
      Tags: [
        {
          Key: "AUTO_DNS_ZONE",
          Value: "Z0366949UUQPUHCZ2AZT",
        },
        {
          Key: "AUTO_DNS_NAME",
          Value: `${subdomain}.failean.com`,
        },
      ],
    };

    await ec2Client.createTags(tagParams);
    console.log("Tags have been created and applied successfully");

    res.status(200).json({ success: true, data: instanceData });
  } catch (err) {
    console.log("Error", err);
    res.status(500).json({ error: err });
  }
});

export default router;
