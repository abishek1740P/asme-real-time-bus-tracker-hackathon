// backend/utils/notify.js
const { admin } = require("./firebaseAdmin");

const sendTestNotification = async (token) => {
  const message = {
    notification: {
      title: "🚌 Bus Alert",
      body: "Your bus is near your stop!",
    },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    // Optionally handle or log error
  }
};

const sendMulticastNotification = async (tokens, title, body) => {
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  const message = {
    notification: { title, body },
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM] Sent: ${response.successCount} success, ${response.failureCount} failed.`);
    
    // Auto-clean bad tokens if any failed
    if (response.failureCount > 0) {
      const NotificationToken = require("../models/NotificationToken");
      const badTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === "messaging/invalid-registration-token" ||
            errCode === "messaging/registration-token-not-registered"
          ) {
            badTokens.push(tokens[idx]);
          }
        }
      });
      if (badTokens.length > 0) {
        await NotificationToken.deleteMany({ token: { $in: badTokens } });
      }
    }

    return response;
  } catch (error) {
    console.error("[FCM] Error sending multicast notification:", error);
    return { successCount: 0, failureCount: tokens.length, error: error.message };
  }
};

module.exports = {
  sendTestNotification,
  sendMulticastNotification,
};
