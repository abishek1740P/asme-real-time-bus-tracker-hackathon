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
    return;
  }

  const message = {
    notification: { title, body },
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    return response;
  } catch (error) {
    // Optionally handle or log error
  }
};

module.exports = {
  sendTestNotification,
  sendMulticastNotification,
};
