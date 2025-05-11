const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const corsOptions = {
  origin: ['http://localhost:5173','https://nline-tutor-booking.web.app/','https://nline-tutor-booking.firebaseapp.com/','https://glittery-melomakarona-339b94.netlify.app'],
  credentials: true,
  optionalSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2ucux.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// verifyToken
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token
  if (!token) return res.status(401).send({ message: 'unauthorized access' })
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
  })

  next()
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();





    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    //  online_Tutors relative api
    const tutorsCollection = client.db('onlineTutor').collection('tutors')
    const booksCollection = client.db('onlineTutor').collection('books')


    // jwt
    app.post('/jwt', async (req, res) => {
      const email = req.body
      const token = jwt.sign(email, process.env.SECRET_KEY, { expiresIn: '5d' })
      console.log(token)
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
        .send({ success: true })
    })
// logout
app.get('/logout', async (req, res) => {
  res
    .clearCookie('token', {
      maxAge: 0,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    })
    .send({ success: true  })
})




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

    app.get('/tutors/:email',verifyToken, async (req, res) => {
      const email = req.params.email;
      const decodedEmail=req.user?.email
     
      if (decodedEmail !== email)
        return res.status(401).send({ message: 'unauthorized access' })
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

    app.put('/update-tutor/:id',verifyToken, async (req, res) => {
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



    app.get('/books/:email', verifyToken, async (req, res) => {
     
      const email = req.params.email;
      const decodedEmail=req.user?.email
      if (decodedEmail !== email)
        return res.status(401).send({ message: 'unauthorized access' })

      const query = { email }
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/books',verifyToken, async (req, res) => {
      const bookData = req.body
      const query = { email: bookData.email, jobId: bookData.jobId }
      const alreadyExist = await booksCollection.findOne(query)
      console.log('If  already exist-->', alreadyExist)
      if (alreadyExist)
        return res
          .status(400)
          .send('You have already booked!')


      const result = await booksCollection.insertOne(bookData)
      res.send(result)
    })

    app.get('/tutors/:id',verifyToken, async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await tutorsCollection.findOne(query);
      res.send(result);
    })

    app.get('/findTutors', async (req, res) => {
      const search = req.query.search
      const sort = req.query.sort
      let options = {}
      if (sort) options = { sort: { 'Price.price': sort === 'asc' ? 1 : -1 } }
      let query = {
        language: {
          $regex: search, $options: 'i'
        }
      }

      const result = await tutorsCollection.find(query, options).toArray()
      res.send(result)
    })




  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch (console.dir);


app.get('/', (req, res) => {
  res.send('Online Tutor Booking server is running')
})

app.listen(port, () => {
  console.log(`Online Tutor Booking server is running on port:${port}`)
})