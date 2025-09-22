// frontend/src/lib/razorpay.js
import api from "./api";

/**
 * Initiates and handles Razorpay payment
 * @param {number} amount - Amount in INR
 * @param {object} optionsExtra - Extra options like prefill
 * @param {function} onSuccess - Callback after successful payment
 */
export async function payWithRazorpay(amount, optionsExtra = {}, onSuccess) {
  try {
    // Create Razorpay order on backend
    const res = await api.post("/payments/initiate", {
      amount: amount * 100, // paise
      currency: "INR",
    });

    const { order } = res.data;

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: order.amount,
      currency: order.currency,
      name: "Bus Ticket Booking",
      description: "Pay for your bus ticket",
      order_id: order.id,
      handler: async function (response) {
        // Verify payment
        await api.post("/payments/verify", {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });

        if (typeof onSuccess === "function") {
          onSuccess(response);
        }
      },
      theme: {
        color: "#3E2F2C",
      },
      ...optionsExtra,
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error(err);
    alert("⚠️ Payment failed.");
  }
}
