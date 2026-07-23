import "dotenv/config";

import prisma from "@/lib/prisma";


async function seedEvent() {
  const event = await prisma.event.upsert({
    where: { singleton: 1 },
    update: {
      title: "The Silk Road Investigation",
      description:
        "Track Noah Carter through the underground Silk Road network and uncover the criminal organization behind the operation.",
      startsAt: new Date("2026-02-26T09:00:00+05:30"),
      endsAt: new Date("2026-02-26T15:00:00+05:30"),
    },
    create: {
      singleton: 1,
      title: "The Silk Road Investigation",
      description:
        "Track Noah Carter through the underground Silk Road network and uncover the criminal organization behind the operation.",
      startsAt: new Date("2026-02-26T09:00:00+05:30"),
      endsAt: new Date("2026-02-26T15:00:00+05:30"),
    },
  });

  console.log("✅ Event initialized");
  console.log(event);
}

seedEvent()
  .catch((error) => {
    console.error("❌ Failed to initialize event");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });