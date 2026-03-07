import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

/**
 * End-to-end tests covering the critical user path:
 *   register → login → create period → create invoice → add payment → close period
 *
 * The test database is seeded fresh for each suite run and torn down after all
 * tests complete.  Requires DATABASE_URL and JWT_SECRET env vars (set in CI).
 */
describe("Critical path (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authCookie: string;
  let userId: string;
  const periodId = new Date().toISOString().slice(0, 7); // YYYY-MM
  let invoiceId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up test data in dependency order
    await prisma.payment.deleteMany();
    await prisma.invoiceShare.deleteMany();
    await prisma.invoiceDistributionRule.deleteMany();
    await prisma.invoiceLine.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.income.deleteMany();
    await prisma.period.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany({ where: { username: "e2e_testadmin" } });
    await prisma.family.deleteMany({
      where: { name: "e2e_testadmin's Family" },
    });
    await app.close();
  });

  // ─── Auth ────────────────────────────────────────────────────────────────────

  describe("Auth flow", () => {
    it("POST /api/auth/register — registers a new user and returns a cookie", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send({
          name: "e2e_testadmin",
          username: "e2e_testadmin",
          password: "SecurePass123!",
        })
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe("e2e_testadmin");
      userId = res.body.user.id;

      const cookies = res.headers["set-cookie"] as string | string[];
      authCookie = Array.isArray(cookies) ? cookies[0] : cookies;
      expect(authCookie).toMatch(/access_token=/);
    });

    it("POST /api/auth/login/password — logs in with valid credentials", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/auth/login/password")
        .send({ username: "e2e_testadmin", password: "SecurePass123!" })
        .expect(200);

      expect(res.body.user.id).toBe(userId);
      const cookies = res.headers["set-cookie"] as string | string[];
      authCookie = Array.isArray(cookies) ? cookies[0] : cookies;
    });

    it("POST /api/auth/login/password — rejects wrong password with 401", async () => {
      await request(app.getHttpServer())
        .post("/api/auth/login/password")
        .send({ username: "e2e_testadmin", password: "WrongPassword" })
        .expect(401);
    });

    it("GET /api/auth/me — returns current user when authenticated", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Cookie", authCookie)
        .expect(200);

      expect(res.body.id).toBe(userId);
    });

    it("GET /api/auth/me — returns 401 without cookie", async () => {
      await request(app.getHttpServer()).get("/api/auth/me").expect(401);
    });
  });

  // ─── Period lifecycle ─────────────────────────────────────────────────────────

  describe("Period lifecycle", () => {
    it("POST /api/periods — creates a new open period", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/periods")
        .set("Cookie", authCookie)
        .send({ id: periodId })
        .expect(201);

      expect(res.body.id).toBe(periodId);
      expect(res.body.status).toBe("OPEN");
    });

    it("GET /api/periods — lists periods including the new one", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/periods")
        .set("Cookie", authCookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((p: { id: string }) => p.id === periodId)).toBe(
        true,
      );
    });
  });

  // ─── Invoice + payment lifecycle ─────────────────────────────────────────────

  describe("Invoice + payment lifecycle", () => {
    it("POST /api/invoices — creates an invoice with BY_PERCENT distribution", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/invoices")
        .set("Cookie", authCookie)
        .send({
          periodId,
          category: "Groceries",
          vendor: "Rema 1000",
          totalCents: 50000,
          distributionMethod: "BY_PERCENT",
          distributionRules: {
            percentRules: [{ userId, percentBasisPoints: 10000 }],
          },
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.totalCents).toBe(50000);
      invoiceId = res.body.id;
    });

    it("GET /api/invoices — lists invoices for the period", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/invoices?periodId=${periodId}`)
        .set("Cookie", authCookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((inv: { id: string }) => inv.id === invoiceId)).toBe(
        true,
      );
    });

    it("POST /api/invoices/:id/payments — records a full payment", async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/invoices/${invoiceId}/payments`)
        .set("Cookie", authCookie)
        .send({ paidById: userId, amountCents: 50000 })
        .expect(201);

      expect(res.body.amountCents).toBe(50000);
      expect(res.body.paidById).toBe(userId);
    });

    it("GET /api/invoices/:id — returns invoice with payments attached", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/invoices/${invoiceId}`)
        .set("Cookie", authCookie)
        .expect(200);

      expect(Array.isArray(res.body.payments)).toBe(true);
      expect(res.body.payments).toHaveLength(1);
      expect(res.body.payments[0].amountCents).toBe(50000);
    });
  });

  describe("Subscriptions lifecycle", () => {
    it("POST /api/subscriptions — creates a recurring expense with amount 0 and description", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/subscriptions")
        .set("Cookie", authCookie)
        .send({
          name: "Template invoice",
          vendor: "Variable vendor",
          category: "Utilities",
          description: "Template description",
          amountCents: 0,
          distributionMethod: "BY_PERCENT",
          distributionRules: {
            percentRules: [{ userId, percentBasisPoints: 10000 }],
            userIds: [userId],
          },
          frequency: "MONTHLY",
          startDate: `${periodId}-01`,
          status: "ACTIVE",
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.amountCents).toBe(0);
      expect(res.body.description).toBe("Template description");
      subscriptionId = res.body.id;
    });

    it("PATCH /api/subscriptions/:id — updates recurring expense description and keeps amount 0", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/subscriptions/${subscriptionId}`)
        .set("Cookie", authCookie)
        .send({
          description: "Updated template description",
          amountCents: 0,
        })
        .expect(200);

      expect(res.body.id).toBe(subscriptionId);
      expect(res.body.amountCents).toBe(0);
      expect(res.body.description).toBe("Updated template description");
    });

    it("GET /api/subscriptions/:id — returns saved recurring expense description", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/subscriptions/${subscriptionId}`)
        .set("Cookie", authCookie)
        .expect(200);

      expect(res.body.id).toBe(subscriptionId);
      expect(res.body.amountCents).toBe(0);
      expect(res.body.description).toBe("Updated template description");
    });
  });

  // ─── Period closing ───────────────────────────────────────────────────────────

  describe("Period closing", () => {
    it("POST /api/periods/:id/close — closes the open period", async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/periods/${periodId}/close`)
        .set("Cookie", authCookie)
        .expect(200);

      expect(res.body.status).toBe("CLOSED");
    });

    it("POST /api/invoices — rejects new invoice on a closed period", async () => {
      await request(app.getHttpServer())
        .post("/api/invoices")
        .set("Cookie", authCookie)
        .send({
          periodId,
          category: "Groceries",
          vendor: "Test",
          totalCents: 10000,
          distributionMethod: "BY_PERCENT",
          distributionRules: {
            percentRules: [{ userId, percentBasisPoints: 10000 }],
          },
        })
        .expect(400);
    });
  });

  // ─── Health ───────────────────────────────────────────────────────────────────

  describe("Health check", () => {
    it("GET /api/health — returns 200 without authentication", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/health")
        .expect(200);

      expect(res.body.status).toBe("ok");
    });
  });
});
