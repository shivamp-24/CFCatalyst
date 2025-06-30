const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const path = require("path");

// This will work in both development and production
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function createAdminUser() {
  try {
    console.log("MONGODB_URI:", process.env.MONGODB_URI);
    console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
    console.log(
      "ADMIN_PASSWORD:",
      process.env.ADMIN_PASSWORD ? "set" : "not set"
    );
    console.log("ADMIN_CF_HANDLE:", process.env.ADMIN_CF_HANDLE);
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminHandle = process.env.ADMIN_CF_HANDLE;

    if (!adminEmail || !adminPassword || !adminHandle) {
      console.error(
        "Error: Admin credentials not found in environment variables"
      );
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = new User({
      email: adminEmail,
      password: hashedPassword,
      codeforcesHandle: adminHandle,
      role: "admin",
      name: "Admin",
      bio: "System Administrator",
      dashboardStats: {
        lastFullUpdate: new Date(),
      },
    });

    await admin.save();
    console.log("Admin user created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();
