const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const stripe = require('stripe')('sk_test_51LU4MfI6LK4d8noQzeDCmWyeesAuMSpX8Bp904AlJc9PXo4X5lto5IksFAGWFaSThtLdz1hjQBOsv0DPi6ztoBbn00aN9u5hV3');

const port = 8000 || process.env.PORT;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y2457.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db("carmax");
    const carCollection = database.collection("cars");
    const upcomingCollection = database.collection("upcoming");
    const ordersCollection = database.collection("orders");
    const usersCollection = database.collection("users");
    const usersReview = database.collection("users_review");
    const contactCollection = database.collection("contact");

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.send({ admin: isAdmin });
    });
   

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.send(result);
    });
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const found = await usersCollection.findOne(filter);
      if (!found) {
        res.send({ isRegistered: false });
        return;
      }
      if (found?.role === "admin") {
        res.send({ isAdmin: true });
        return;
      }
      const updateRole = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateRole);
      res.send(result);
    });

    app.post("/addCar", async (req, res) => {
      const result = await carCollection.insertOne(req.body);
      res.send(result);
      console.log(result);
    });
    app.get("/addCar", async (req, res) => {
      const result = await carCollection.find({}).toArray();
      res.json(result);
    });
    app.post("/addUpcomingCar", async (req, res) => {
      const result = await upcomingCollection.insertOne(req.body);
      res.send(result);
      console.log(result);
    });
    app.get("/addUpcomingCar", async (req, res) => {
      const result = await upcomingCollection.find({}).toArray();
      res.json(result);
    });
    app.get("/addCar/:id", async (req, res) => {
      const query = { _id: ObjectId(req.params.id) };
      const car = await carCollection.findOne(query);
      res.send(car);
    });
    app.delete("/addCar/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await carCollection.deleteOne(query);
      res.json(result);
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      console.log(req.body);
      const result = await usersReview.insertOne(review);
      res.send(result);
    });
    app.get("/reviews", async (req, res) => {
      const result = await usersReview.find({}).toArray();
      res.send(result);
    });
    app.post("/orders", async (req, res) => {
      const result = await ordersCollection.insertOne(req.body);
      res.send(result);
    });
    app.get("/orders", async (req, res) => {
      const result = await ordersCollection.find({}).toArray();
      res.send(result);
    });
    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const result = await ordersCollection
        .find({ email: { $regex: email } })
        .toArray();
      res.send(result);
    });

    app.put("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const reqStatus = req.body.status;
      const filter = { _id: ObjectId(id) };
      // const option = { upsert: true }
      const updatedStatus = {
        $set: {
          status: reqStatus,
        },
      };
      const result = await ordersCollection.updateOne(filter, updatedStatus);
      res.send(result);
    });

    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.json(result);
    });

    app.post("/contact", async (req, res) => {
      const result = await contactCollection.insertOne(req.body);
      res.send(result);
    });
    app.get("/contact", async (req, res) => {
      const result = await contactCollection.find({}).toArray();
      res.send(result);
    });
    app.post("/create-payment-intent", async (req, res) => {
      const paymentInfo = req.body;
      const amount = paymentInfo.price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello this server engineers are joy, khaled and nishat");
});

app.listen(port, () => {
  console.log(`port run on ${port}`);
});
