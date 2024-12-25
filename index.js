const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config()

const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2ucux.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    //  online_Tutors relative api
    const tutorsCollection = client.db('onlineTutor').collection('tutors')
    const booksCollection= client.db('onlineTutor').collection('books')
    


    app.post('/tutors', async (req, res) => {
      const newTutor = req.body
      console.log(newTutor)
      const result = await tutorsCollection.insertOne(newTutor)
      res.send(result)
    })

    app.get('/tutors', async (req, res) => {
      const cursor = tutorsCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    // filter by specific user

    app.get('/tutors/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'buyer.email': email }
      const result = await tutorsCollection.find(query).toArray();
      res.send(result);
    })

    //  delete
    app.delete('/tutor/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await tutorsCollection.deleteOne(query);
      res.send(result);
    })
    //  update
    app.get('/tutor/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await tutorsCollection.findOne(query);
      res.send(result);
    })

    app.put('/update-tutor/:id', async (req, res) => {
      const id = req.params.id;
      const updateTutor = req.body
      const update = {
        $set: updateTutor,
      }
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true }

      const result = await tutorsCollection.updateOne(query, update, options)
      res.send(result)
    })



        // save a bid data in db
        app.post('/myBook', async (req, res) => {
          const bookData = req.body
          // 0. if a user placed a bid already in this job
          const query = { email: bookData.email, jobId: bookData.jobId }
          const alreadyExist = await booksCollection.findOne(query)
          console.log('If already exist-->', alreadyExist)
          if (alreadyExist)
            return res
              .status(400)
              .send('You have already placed a bid on this job!')
          // 1. Save data in bids collection
    
          const result = await booksCollection.insertOne(bookData)
          res.send(result)
        })


    app.get('/tutors/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await tutorsCollection.findOne(query);
      res.send(result);
    })



  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Online Tutor Booking server is running')
})

app.listen(port, () => {
  console.log(`Online Tutor Booking server is running on port:${port}`)
})