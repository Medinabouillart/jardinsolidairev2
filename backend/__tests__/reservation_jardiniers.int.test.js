const express = require("express");
const request = require("supertest");
const cookieParser = require("cookie-parser");

const router = require("../routes/reservation_jardiniers");

// App de test minimale
function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser()); // ✅ indispensable pour req.cookies
  app.use("/api/reservation_jardiniers", router);
  return app;
}

describe("Integration - reservation_jardiniers (auth + validations)", () => {
  const app = makeApp();


  test("❌ POST /:id/messages → 401 si non connecté", async () => {
    const res = await request(app)
      .post("/api/reservation_jardiniers/10/messages")
      .send({ contenu: "Bonjour !" });

    expect(res.statusCode).toBe(401);
  });

  // ✅ Test stable sans DB :
  // Avec cookie, on passe requireAuth, puis on tombe sur la validation id
  test("✅ POST /:id/messages → 400 si connecté mais id invalide", async () => {
    const res = await request(app)
      .post("/api/reservation_jardiniers/0/messages")
      .set("Cookie", ["user_id=1"])
      .send({ contenu: "Bonjour !" });

    expect(res.statusCode).toBe(400);
  });

  test("✅ POST /:id/messages → 400 si connecté mais message trop court", async () => {
    const res = await request(app)
      .post("/api/reservation_jardiniers/10/messages")
      .set("Cookie", ["user_id=1"])
      .send({ contenu: "a" });

    expect(res.statusCode).toBe(400);
  });

  test("❌ GET /:id/messages → 401 si non connecté", async () => {
    const res = await request(app)
      .get("/api/reservation_jardiniers/10/messages");

    expect(res.statusCode).toBe(401);
  });

  test("✅ GET /:id/messages → 400 si connecté mais id invalide", async () => {
    const res = await request(app)
      .get("/api/reservation_jardiniers/0/messages")
      .set("Cookie", ["user_id=1"]);

    expect(res.statusCode).toBe(400);
  });


  test.skip("✅ POST /:id/messages → 201 si connecté + jardinier public existe", async () => {
    const res = await request(app)
      .post("/api/reservation_jardiniers/10/messages")
      .set("Cookie", ["user_id=1"])
      .send({ contenu: "Hello, je suis intéressée !" });

    expect(res.statusCode).toBe(201);
  });

  test.skip("✅ GET /:id → 200 si le profil jardinier public existe", async () => {
    const res = await request(app)
      .get("/api/reservation_jardiniers/10");

    expect(res.statusCode).toBe(200);
  });
});

