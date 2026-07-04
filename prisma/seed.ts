import { prisma } from "./client";

const roles = async () => {
    await prisma.role.upsert({
        where: {
            id: 1
        },
        create: {
            id: 1,
            name: "USER"
        },
        update: {}
    });

    await prisma.role.upsert({
        where: {
            id: 2
        },
        create: {
            id: 2,
            name: "ADMIN"
        },
        update: {}
    });

    await prisma.role.upsert({
        where: {
            id: 3
        },
        create: {
            id: 3,
            name: "GROUP_MANAGER"
        },
        update: {}
    });

    console.log("roles are synced");
};

const groups = async () => {
    const groupCount = await prisma.group.count();

    if (groupCount === 0) {
        const defaultGroup = await prisma.group.create({
            data: {
                name: "Default"
            }
        });

        const allUsers = await prisma.user.findMany();
        for (const user of allUsers) {
            await prisma.userGroupMembership.create({
                data: {
                    active: true,
                    user: {
                        connect: {
                            id: user.id
                        }
                    },
                    group: {
                        connect: {
                            id: defaultGroup.id
                        }
                    }
                }
            });
        }

        console.log("created default group");
    } else {
        console.log("skipping default group creation");
    }
};

const exchangeRates = async () => {
    if (!process.env.SEED_TEST_FX_RATES) {
        return;
    }
    await prisma.exchangeRates.upsert({
        where: { id: "global" },
        create: {
            id: "global",
            base: "USD",
            rates: JSON.stringify({ USD: 1, EUR: 0.5, JPY: 100 }),
            ratesDate: "2026-01-01 00:00:00 UTC",
            fetchedAt: new Date()
        },
        update: {
            base: "USD",
            rates: JSON.stringify({ USD: 1, EUR: 0.5, JPY: 100 }),
            ratesDate: "2026-01-01 00:00:00 UTC",
            fetchedAt: new Date()
        }
    });
    console.log("seeded test exchange rates");
};

const main = async () => {
    await roles();
    await groups();
    await exchangeRates();
};

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);

        await prisma.$disconnect();
        process.exit(1);
    });
