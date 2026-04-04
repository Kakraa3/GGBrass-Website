const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Resend } = require('resend');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));

// Resend email client
const resend = new Resend(process.env.RESEND_API_KEY);

// Newsletter model
const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now }
});
const Newsletter = mongoose.model("Newsletter", newsletterSchema);

// Health check
app.get('/', (req, res) => {
  res.send('Backend is working!');
});

// Contact + Booking + Newsletter
app.post('/contact', async (req, res) => {
  const { name, email, message, type } = req.body;

  try {
    // NEWSLETTER → save to DB only
    if (type === "newsletter") {
      const existing = await Newsletter.findOne({ email });
      if (existing) {
        return res.json({ message: "You are already subscribed!" });
      }
      const newSubscriber = new Newsletter({ email });
      await newSubscriber.save();
      return res.json({ message: "Subscribed successfully!" });
    }

    // CONTACT or BOOKING → send email via Resend
    const subject = type === "booking" ? "New Booking Request" : "New Contact Message";

    await resend.emails.send({
      from: 'GGBrass Website <onboarding@resend.dev>',
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

// Send newsletter to all subscribers
app.post('/send-newsletter', async (req, res) => {
  const { subject, message } = req.body;

  try {
    const subscribers = await Newsletter.find();

    for (const sub of subscribers) {
      await resend.emails.send({
        from: 'GGBrass <onboarding@resend.dev>',
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