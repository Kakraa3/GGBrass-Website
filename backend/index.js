const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Resend } = require('resend');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ggbrass2024';

// SCHEMAS 

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now }
});
const Newsletter = mongoose.model("Newsletter", newsletterSchema);

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  type: { type: String, default: 'contact' },
  date: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});
const Contact = mongoose.model("Contact", contactSchema);

const imageSchema = new mongoose.Schema({
  filename: String,
  label: String,
  url: String,
  date: { type: Date, default: Date.now }
});
const Image = mongoose.model("Image", imageSchema);

// MULTER 

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// HEALTH CHECK 

app.get('/', (req, res) => res.send('Backend is working!'));

// ADMIN AUTH 

app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Wrong password' });
  }
});

// PUBLIC: CONTACT + BOOKING + NEWSLETTER 

app.post('/contact', async (req, res) => {
  const { name, email, message, type } = req.body;
  try {
    if (type === "newsletter") {
      const existing = await Newsletter.findOne({ email });
      if (existing) return res.json({ message: "You are already subscribed!" });
      await new Newsletter({ email }).save();
      return res.json({ message: "Subscribed successfully!" });
    }
    await new Contact({ name, email, message, type }).save();
    const subject = type === "booking" ? "New Booking Request" : "New Contact Message";
    await resend.emails.send({
      from: 'GGBrass Website <onboarding@resend.dev>',
      to: 'clementeklu2004@gmail.com',
      replyTo: email,
      subject,
      text: `Type: ${type || "contact"}\nName: ${name || "N/A"}\nEmail: ${email}\nMessage: ${message || "N/A"}`,
    });
    res.json({ message: "Message sent successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error processing request" });
  }
});

// ADMIN: SUBSCRIBERS 

app.get('/admin/subscribers', async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ date: -1 });
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching subscribers" });
  }
});

app.delete('/admin/subscribers/:id', async (req, res) => {
  try {
    await Newsletter.findByIdAndDelete(req.params.id);
    res.json({ message: "Subscriber deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting subscriber" });
  }
});

// ADMIN: MESSAGES & BOOKINGS

app.get('/admin/messages', async (req, res) => {
  try {
    const messages = await Contact.find({ type: 'contact' }).sort({ date: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
  }
});

app.get('/admin/bookings', async (req, res) => {
  try {
    const bookings = await Contact.find({ type: 'booking' }).sort({ date: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

app.delete('/admin/messages/:id', async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting" });
  }
});

app.patch('/admin/messages/:id/read', async (req, res) => {
  try {
    await Contact.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating" });
  }
});

// ADMIN: NEWSLETTER BROADCAST 

app.post('/send-newsletter', async (req, res) => {
  const { subject, message } = req.body;
  try {
    const subscribers = await Newsletter.find();
    for (const sub of subscribers) {
      await resend.emails.send({
        from: 'GGBrass <onboarding@resend.dev>',
        to: sub.email,
        subject,
        text: message
      });
    }
    res.json({ message: `Newsletter sent to ${subscribers.length} subscribers!` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Newsletter failed" });
  }
});

// ADMIN: IMAGES 

app.get('/admin/images', async (req, res) => {
  try {
    const images = await Image.find().sort({ date: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: "Error fetching images" });
  }
});

app.post('/admin/images', upload.single('image'), async (req, res) => {
  try {
    const { label } = req.body;
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const image = new Image({ filename: req.file.filename, label, url });
    await image.save();
    res.json({ message: "Image uploaded", image });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error uploading image" });
  }
});

app.delete('/admin/images/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ message: "Image not found" });
    const filePath = path.join(__dirname, 'uploads', image.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await Image.findByIdAndDelete(req.params.id);
    res.json({ message: "Image deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting image" });
  }
});

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  venue: String,
  description: String,
  ticketLink: String,
  createdAt: { type: Date, default: Date.now }
});
const Event = mongoose.model("Event", eventSchema);

//  START SERVER

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// GET all events
app.get('/admin/events', async (req, res) => {
  const events = await Event.find().sort({ date: 1 });
  res.json(events);
});

// POST new event
app.post('/admin/events', async (req, res) => {
  const { name, date, venue, description, ticketLink } = req.body;
  const event = new Event({ name, date, venue, description, ticketLink });
  await event.save();
  res.json({ message: 'Event added successfully!' });
});

// DELETE an event
app.delete('/admin/events/:id', async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: 'Event deleted.' });
});