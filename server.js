import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
import nodemailer from "nodemailer";
import twilio from "twilio";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const API_KEY = process.env.API_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER;

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// Twilio client for WhatsApp
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Example route for signals
app.get("/signals/:pair", async (req, res) => {
  try {
    const { pair } = req.params;
    const response = await axios.get(
      `https://api.twelvedata.com/ema?symbol=${pair}&interval=1h&apikey=${API_KEY}`
    );

    const signal = {
      pair,
      signal: "BUY",
      entry: 1900.5,
      tp1: 1910.0,
      tp2: 1920.0,
      sl: 1885.0,
      confidence: 85,
      timeframe: "medium",
      reason: "EMA crossover + bullish trend",
      timestamp: new Date()
    };

    // Send email
    await transporter.sendMail({
      from: EMAIL_USER,
      to: EMAIL_USER,
      subject: `Trading Signal: ${signal.pair} - ${signal.signal}`,
      text: JSON.stringify(signal, null, 2)
    });

    // Send WhatsApp
    await twilioClient.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:+27${WHATSAPP_NUMBER}`,
      body: JSON.stringify(signal, null, 2)
    });

    res.json({ success: true, signal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch signal" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
