const PDFDocument = require("pdfkit");
const Driver = require("../models/Driver");
const Bus = require("../models/Bus");
const User = require("../models/User");
const Conductor = require("../models/Conductor"); // ✅ Add this

// Generate Students (Users with role = student) PDF
exports.generateStudentsPdf = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).populate(
      "bus",
      "name number"
    );

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=students.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Student List", { underline: true }).moveDown();

    students.forEach((s, i) => {
      doc
        .fontSize(12)
        .text(
          `${i + 1}. ${s.name} | ${s.registerNo || "N/A"} | ${s.email} | ${
            s.phone || "N/A"
          } | Bus: ${s.bus?.name || "N/A"} (${s.bus?.number || "N/A"})`
        );
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: "Failed to generate student PDF" });
  }
};

// Generate Drivers PDF
exports.generateDriversPdf = async (req, res) => {
  try {
    const buses = await Bus.find().populate("driver").populate("route", "name");

    const drivers = buses.map((bus) => ({
      name: bus.driver?.name,
      email: bus.driver?.email,
      phone: bus.driver?.phone,
      busName: bus.name,
      routeName: bus.route?.name,
    }));

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=drivers.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Driver List", { underline: true }).moveDown();

    drivers.forEach((d, i) => {
      doc
        .fontSize(12)
        .text(
          `${i + 1}. ${d.name || "N/A"} | ${d.email || "N/A"} | ${
            d.phone || "N/A"
          } | Bus: ${d.busName || "N/A"} | Route: ${d.routeName || "N/A"}`
        );
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: "Failed to generate driver PDF" });
  }
};

// ✅ Generate Conductors PDF
exports.generateConductorsPdf = async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate("conductor")
      .populate("route", "name");

    const conductors = buses.map((bus) => ({
      name: bus.conductor?.name,
      email: bus.conductor?.email,
      phone: bus.conductor?.phone,
      busName: bus.name,
      routeName: bus.route?.name,
    }));

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=conductors.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Conductor List", { underline: true }).moveDown();

    conductors.forEach((c, i) => {
      doc
        .fontSize(12)
        .text(
          `${i + 1}. ${c.name || "N/A"} | ${c.email || "N/A"} | ${
            c.phone || "N/A"
          } | Bus: ${c.busName || "N/A"} | Route: ${c.routeName || "N/A"}`
        );
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate conductor PDF" });
  }
};
