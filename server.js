const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: "https://rahulgupta143.github.io"
  })
);
app.use(express.json());

/* ================= DATABASE ================= */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });

/* ================= SCHEMA ================= */

const moneySchema = new mongoose.Schema(
  {
    target: {
      type: Number,
      default: 0,
    },

    earnings: [
      {
        id: Number,
        date: String,
        amount: Number,
        note: String,
      },
    ],

    expenses: [
      {
        id: Number,
        date: String,
        amount: Number,
        category: String,
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Money = mongoose.model("Money", moneySchema);

/* ================= GET DATA ================= */

app.get("/api/money", async (req, res) => {
  try {
    let money = await Money.findOne();

    if (!money) {
      money = await Money.create({
        target: 0,
        earnings: [],
        expenses: [],
      });
    }

    res.json(money);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load money data",
    });
  }
});

/* ================= SAVE DATA ================= */

app.put("/api/money", async (req, res) => {
  try {
    const { target, earnings, expenses } = req.body;

    let money = await Money.findOne();

    if (!money) {
      money = new Money();
    }

    money.target = Number(target) || 0;
    money.earnings = Array.isArray(earnings) ? earnings : [];
    money.expenses = Array.isArray(expenses) ? expenses : [];

    await money.save();

    console.log("Data saved to MongoDB ✅");

    res.json(money);
  } catch (error) {
    console.error("SAVE ERROR:", error);

    res.status(500).json({
      message: "Failed to save money data",
      error: error.message,
    });
  }
});

/* ================= FRONTEND ================= */

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MoneyFlow running on port ${PORT}`);
});
