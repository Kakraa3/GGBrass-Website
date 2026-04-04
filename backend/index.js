const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB connection (make sure MONGO_URI is set in Render environment variables)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));

// ✅ Transporter defined BEFORE routes so it's available when needed
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,       // set in Render environment variables
    pass: process.env.EMAIL_PASS        // set in Render environment variables
  }
});

// ✅ Schemas defined after mongoose is imported
const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }
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

    // CONTACT or BOOKING → send email
    const subject = type === "booking" ? "New Booking Request" : "New Contact Message";

    await transporter.sendMail({
      from: `"GGBrass Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
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
      await transporter.sendMail({
        from: `"GGBrass" <${process.env.EMAIL_USER}>`,
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