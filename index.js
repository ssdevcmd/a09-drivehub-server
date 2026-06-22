const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

async function run() {
  try {
    await client.connect();

    const db = client.db('drivehub')
    const carCollection = db.collection('cars')

    app.get('/explore-cars', async (req, res) => {
      const result = await carCollection.find().toArray()
      res.json(result);
    });

    app.post('/car', async (req, res) => {
      const carData = req.body
      console.log(carData);
      const result = await carCollection.insertOne(carData)

      res.json(result);
    });

    app.get('/explore-cars/:id', async (req, res) => {
      const {id} = req.params

      const result = await carCollection.findOne({_id: new ObjectId(id)})

      res.json(result);
    });

    app.patch('/explore-cars/:id', async (req, res) => {
      const {id} = req.params
      const updatedData = req.body

      console.log(id);
      console.log(updatedData);

      const result = await carCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: updatedData}
      )

      res.json(result)
    });



    await client.db("admin").command({ ping: 1 });
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