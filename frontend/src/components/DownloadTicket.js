"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";

export default function DownloadTicket({ ticket }) {
  const qrRef = useRef();

  const handleDownload = async () => {
    try {
      // Create a container for ticket layout
      const element = document.createElement("div");
      element.style.width = "450px";
      element.style.padding = "30px";
      element.style.fontFamily = "Arial, sans-serif";
      element.style.background = "#fff";
      element.style.borderRadius = "20px";
      element.style.color = "#000"; // black text
      element.style.position = "relative";
      element.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";

      // Watermark
      const watermark = document.createElement("div");
      watermark.innerText = "SRIT Bus Ticket";
      watermark.style.position = "absolute";
      watermark.style.top = "50%";
      watermark.style.left = "50%";
      watermark.style.transform = "translate(-50%, -50%) rotate(-30deg)";
      watermark.style.fontSize = "50px";
      watermark.style.color = "rgba(0,0,0,0.05)";
      watermark.style.pointerEvents = "none";
      element.appendChild(watermark);

      // Title
      const title = document.createElement("h2");
      title.innerText = "🎟️ Bus Ticket";
      title.style.textAlign = "center";
      title.style.marginBottom = "25px";
      title.style.fontSize = "28px";
      element.appendChild(title);

      // Ticket details container
      const details = document.createElement("div");
      details.style.lineHeight = "1.6";
      details.style.fontSize = "16px";
      details.style.marginBottom = "25px";
      details.innerHTML = `
        <p><b>Bus:</b> ${ticket.bus?.name || "N/A"} (${
        ticket.bus?.number || "N/A"
      })</p>
        <p><b>Route:</b> ${ticket.bus?.route?.name || "N/A"}</p>
        <p><b>Driver:</b> ${ticket.bus?.driver?.name || "N/A"} | ${
        ticket.bus?.driver?.phone || "N/A"
      }</p>
        <p><b>Seats:</b> ${ticket.seats}</p>
        <p><b>From:</b> ${ticket.startPoint || "N/A"} → <b>To:</b> ${
        ticket.stopPoint || "N/A"
      }</p>
        <p><b>Fare:</b> ₹${ticket.fare}</p>
        <p><b>Status:</b> ${ticket.status}</p>
        <p><b>Booked At:</b> ${
          ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "N/A"
        }</p>
      `;
      element.appendChild(details);

      // QR code for PDF
      const qrCanvas = document.createElement("canvas");
      const qr = qrRef.current.querySelector("canvas");
      if (qr) {
        qrCanvas.width = qr.width;
        qrCanvas.height = qr.height;
        const ctx = qrCanvas.getContext("2d");
        ctx.drawImage(qr, 0, 0);

        const qrImg = document.createElement("img");
        qrImg.src = qrCanvas.toDataURL("image/png");
        qrImg.style.display = "block";
        qrImg.style.margin = "0 auto";
        qrImg.style.width = "160px";
        qrImg.style.border = "2px solid #000";
        qrImg.style.padding = "5px";
        qrImg.style.borderRadius = "10px";
        element.appendChild(qrImg);
      }

      // Append to DOM temporarily
      document.body.appendChild(element);

      // Convert to canvas
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      // Remove temporary element
      document.body.removeChild(element);

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 180;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 15, 20, imgWidth, imgHeight);
      pdf.save(`Ticket_${ticket.bus?.name || "Bus"}_${ticket._id}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    }
  };

  return (
    <div>
      {/* Hidden QR for PDF export */}
      <div ref={qrRef} style={{ display: "none" }}>
        <QRCodeCanvas
          value={ticket._id}
          size={150}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:scale-105 transform transition px-4 py-1.5 rounded-xl shadow text-white mt-4 w-full"
      >
        ⬇️ Download Ticket (PDF)
      </button>
    </div>
  );
}
