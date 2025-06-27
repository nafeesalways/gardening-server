const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b4gl5td.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    console.log("Connected to MongoDB!");

    const gardenCollection = client.db("gardenDB").collection("garden");

    // --- NEW ENDPOINT TO GET PUBLIC GARDEN TIPS ---

    app.get("/public-garden-tips", async (req, res) => {
      try {
        const { difficulty } = req.query;
        const query = { availability: "Public" };

        if (difficulty) {
          query.difficulty = { $regex: new RegExp(`^${difficulty}$`, "i") }; // case-insensitive
        }

        const publicTips = await gardenCollection.find(query).toArray();
        console.log(difficulty, publicTips, query);
        res.status(200).send(publicTips);
      } catch (error) {
        console.error("Error fetching garden tips:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.patch("/tips/:id/like", async (req, res) => {
      const { id } = req.params;

      try {
        const result = await gardenCollection.updateOne(
          { _id: new ObjectId(id) },
          { $inc: { like: 1 } } // increment 'like' field
        );

        if (result.modifiedCount === 1) {
          res.status(200).json({ message: "Like added successfully." });
        } else {
          res.status(404).json({ message: "Tip not found." });
        }
      } catch (error) {
        console.error("Error updating like:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    app.post("/garden-tips", async (req, res) => {
      try {
        const newGardenTip = req.body;
        newGardenTip.createdAt = new Date(); // Add timestamp
        const result = await gardenCollection.insertOne(newGardenTip);
        console.log("Garden tip submitted:", result);
        res.status(201).send({
          message: "Garden tip submitted successfully!",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error submitting garden tip:", error);
        res.status(500).send({
          message: "Failed to submit garden tip",
          error: error.message,
        });
      }
    });

    app.post("/featured", async (req, res) => {
      const newFeatured = req.body;
      const result = await gardenCollection.insertOne(newFeatured);
      res.send(result);
    })

    app.get("/active-gardeners", async (req, res) => {
      try {
        const activeGardeners = await gardenCollection
          .find({ active: true })
          .limit(6)
          .toArray();
        res.send(activeGardeners);
      } catch (error) {
        console.error("Error fetching active gardeners:", error);
        res.status(500).send({
          message: "Failed to fetch active gardeners",
          error: error.message,
        });
      }
    });


    app.get("/active-gardeners/count", async (req, res) => {
      const count = await gardenCollection.countDocuments({ isActive: true });
      res.json({ count });
    });
    // Assuming you have a MongoDB collection called gardeners

    // Get single tip by ID
    app.get("/singleData/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await gardenCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch the tip" });
      }
    });
    app.get("/myTips", async (req, res) => {
      const cursor = gardenCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/myTips/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await gardenCollection.findOne(query);
      res.send(result);
    });
    app.put("/myTips/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedTip = req.body;
      const updatedDoc = {
        $set: updatedTip,
      };
      const result = await gardenCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    app.delete("/myTips/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await gardenCollection.deleteOne(query);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Keep the client open for continuous requests.
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Gardening Community is running");
});

app.listen(port, () => {
  console.log(`Gardening Community is running on port ${port}`);
});
