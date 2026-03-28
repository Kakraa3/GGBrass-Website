const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/ggbrass")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

  const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  }
});


const Subscriber = mongoose.model("Subscriber", subscriberSchema);

const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors()); // allows frontend to connect
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is working!');
});

app.post('/contact', async (req, res) => {
  const { name, email, message, type } = req.body;

  const subject = type === "booking"
    ? "🎺 New Booking Request"
    : "📩 New Contact Message";

  try {
    await transporter.sendMail({
      from: email,
      to: 'clementeklu2004@gmail.com',
      subject: subject,
      text: `
Type: ${type}

Name: ${name}
Email: ${email}
Message: ${message}
      `,
    });

    res.json({ message: 'Message sent successfully!' });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

app.post('/subscribe', async (req, res) => {

  const { email } = req.body;

  try {

    const existing = await Subscriber.findOne({ email });

    if (existing) {
      return res.json({ message: "Already subscribed!" });
    }

    const newSubscriber = new Subscriber({ email });

    await newSubscriber.save();

    res.json({ message: "Subscribed successfully!" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Subscription failed" });
  }

});

app.post('/send-newsletter', async (req, res) => {

  const { subject, message } = req.body;

  try {

    const subscribers = await Subscriber.find();

    for (const sub of subscribers) {

      await transporter.sendMail({
        from: "clementeklu2004@gmail.com",
        to: sub.email,
        subject: subject,
        text: message
      });

    }

    res.json({ message: "Newsletter sent!" });

  } catch (error) {

    console.log(error);
    res.status(500).json({ message: "Newsletter failed" });

  }

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'clementeklu2004@gmail.com',
    pass: 'blsnxztrycigpgxz'
  }
});
