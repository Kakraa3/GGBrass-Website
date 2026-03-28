const mongoose = require('mongoose');

const Newsletter = require('./models/Newsletter');

//mongoose.connect("mongodb://127.0.0.1:27017/ggbrass")
  //.then(() => console.log("MongoDB connected"))
  //.catch(err => console.log(err));

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

  try {
    // NEWSLETTER → SAVE TO DB ONLY
    if (type === "newsletter") {
  try {
    const existingUser = await Newsletter.findOne({ email });

    if (existingUser) {
      return res.json({ message: "You are already subscribed!" });
    }

    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();

    return res.json({ message: "Subscribed successfully!" });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error subscribing" });
  }
}

    // EMAIL PART (CONTACT + BOOKING)
    let subject;

    if (type === "booking") {
      subject = "New Booking Request";
    } else {
      subject = "New Contact Message";
    }

    await transporter.sendMail({
      from: '"GGBrass Website" <clementeklu2004@gmail.com>',
      to: 'clementeklu2004@gmail.com',
      replyTo: email,
      subject: subject,
      text: `
Type: ${type || "contact"}

Name: ${name || "N/A"}
Email: ${email}
Message: ${message || "N/A"}
      `,
    });

    res.json({ message: "Message sent successfully!" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error processing request" });
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
