import bcrypt from "bcrypt";
import {
  PrismaClient,
  RequestStatus,
  ResourceStatus,
  UrgencyLevel,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demoPasswordHash = await bcrypt.hash("AidLine123!", 10);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@aidline.org" },
    update: {},
    create: {
      fullName: "AidLine Demo Admin",
      email: "demo@aidline.org",
      passwordHash: demoPasswordHash,
      phone: "+96170000000",
      role: UserRole.ADMIN,
    },
  });

  await prisma.clinic.createMany({
    data: [
      {
        name: "Beirut Central Clinic",
        district: "Beirut",
        address: "Hamra Main Street",
        phone: "+9611111111",
        status: ResourceStatus.ACTIVE,
        latitude: 33.8938,
        longitude: 35.5018,
      },
      {
        name: "Tripoli Health Point",
        district: "Tripoli",
        address: "Mina Road",
        phone: "+9616222222",
        status: ResourceStatus.ACTIVE,
        latitude: 34.4335,
        longitude: 35.8442,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.shelter.createMany({
    data: [
      {
        name: "North Relief Shelter",
        district: "Tripoli",
        address: "Relief Camp 1",
        capacity: 120,
        occupancy: 78,
        phone: "+9616333333",
        status: ResourceStatus.ACTIVE,
        latitude: 34.44,
        longitude: 35.85,
      },
      {
        name: "Beirut Family Shelter",
        district: "Beirut",
        address: "Downtown Safe Zone",
        capacity: 90,
        occupancy: 64,
        phone: "+9611444444",
        status: ResourceStatus.ACTIVE,
        latitude: 33.89,
        longitude: 35.5,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.gasStation.createMany({
    data: [
      {
        name: "Fuel Point Beirut",
        district: "Beirut",
        address: "Mazraa Highway",
        phone: "+9611555555",
        fuelTypes: ["95", "98", "diesel"],
        status: ResourceStatus.ACTIVE,
        latitude: 33.89,
        longitude: 35.49,
      },
      {
        name: "North Diesel Hub",
        district: "Tripoli",
        address: "Port Access Road",
        phone: "+9611666666",
        fuelTypes: ["diesel"],
        status: ResourceStatus.ACTIVE,
        latitude: 34.43,
        longitude: 35.85,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.volunteer.createMany({
    data: [
      {
        userId: demoUser.id,
        fullName: demoUser.fullName,
        phone: demoUser.phone,
        district: "Beirut",
        skills: ["First Aid", "Coordination"],
        availability: true,
        status: ResourceStatus.ACTIVE,
        latitude: 33.89,
        longitude: 35.5,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.medicationRequest.createMany({
    data: [
      {
        userId: demoUser.id,
        medicationName: "Insulin",
        quantity: 2,
        urgency: UrgencyLevel.HIGH,
        district: "Beirut",
        notes: "Type 1 diabetes patient",
        status: RequestStatus.PENDING,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.sOSRequest.createMany({
    data: [
      {
        userId: demoUser.id,
        fullName: "AidLine Demo Admin",
        phone: "+96170000000",
        district: "Beirut",
        emergencyType: "Medical Emergency",
        notes: "Seed SOS for dashboard/testing",
        latitude: 33.8938,
        longitude: 35.5018,
        status: RequestStatus.IN_PROGRESS,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        senderId: demoUser.id,
        senderName: demoUser.fullName,
        message: "Welcome to AidLine support channel.",
        channel: "support",
        district: "Beirut",
      },
      {
        senderId: null,
        senderName: "Support Agent",
        message: "A responder will assist shortly.",
        channel: "support",
        district: "Beirut",
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
