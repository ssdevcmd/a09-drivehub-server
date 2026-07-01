const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
dotenv.config()

const uri = process.env.MONGODB_URI;

const app = express()
const PORT = process.env.PORT

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  // console.log(token);

  try {
    const { payload } = await jwtVerify(token, JWKS)
    console.log(payload);
    next()
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden' });
  }
}

async function run() {
  try {
    // await client.connect();

    const db = client.db('drivehub');
    const carCollection = db.collection('cars');
    const bookingCollection = db.collection('bookings');

    app.get('/cars', async (req, res) => {
      const query = {

        availability: 'Available'
      }
      const cursor = carCollection.find(query).limit(6);
      const result = await cursor.toArray()
      res.json(result);
    });

    app.post('/car', verifyToken, async (req, res) => {
      const carData = req.body
      const result = await carCollection.insertOne(carData)

      res.json(result);
    });


    app.get('/explore-cars', async (req, res) => {
      const { search = "", type = "All" } = req.query;

      const query = {};

      if (search) {
        query.carModel = {
          $regex: search,
          $options: "i",
        };
      }

      if (type && type !== "All") {
        query.carType = type;
      }

      // console.log(query);

      const result = await carCollection.find(query).toArray();

      res.json(result);
    });

    //middleware
    app.get('/explore-cars/:id', verifyToken, async (req, res) => {
      const { id } = req.params

      const result = await carCollection.findOne({ _id: new ObjectId(id) })

      res.json(result);
    });


    app.patch('/explore-cars/:id', verifyToken, async (req, res) => {
      const { id } = req.params
      const updatedData = req.body

      // console.log(id);
      // console.log(updatedData);

      const result = await carCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      )

      res.json(result)
    });

    app.delete('/explore-cars/:id', verifyToken, async (req, res) => {
      const { id } = req.params
      const result = await carCollection.deleteOne({ _id: new ObjectId(id) })

      res.json(result)
    });

    app.get('/booking/:userId', verifyToken, async (req, res) => {
      const { userId } = req.params

      const result = await bookingCollection.find({ userId }).toArray()

      res.json(result)
    });

    app.post('/booking', verifyToken, async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData)

      await carCollection.updateOne(
        { _id: new ObjectId(bookingData.carId) },
        {
          $inc: {
            booking_count: 1
          }
        }
      )

      res.json(result)
    });

    app.delete('/booking/:bookingId', verifyToken, async (req, res) => {
      const { bookingId } = req.params;
      const result = await bookingCollection.deleteOne({ _id: new ObjectId(bookingId) })

      res.json(result)
    });

    app.get('/my-added-cars/:userId', verifyToken, async (req, res) => {
      const { userId } = req.params;
      const result = await await carCollection.find({ userId }).toArray()

      res.json(result)
    });



    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running fine')
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})