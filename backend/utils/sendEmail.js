const { Resend } = require("resend");

// Initialize Resend lazily to prevent boot crashes if process.env isn't loaded instantly
const sendEmail = async ({ email, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY missing in environment variables!");
    throw new Error("Email service is not configured on the server.");
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: "NVS Jewellery <onboarding@resend.dev>",
    to: [email],
    subject,
    html,
  });

  if (error) {
    console.error("❌ Resend Delivery Error:", JSON.stringify(error, null, 2));
    
    // Provide explicit error context if using testing domain with non-owner email
    if (error.message && error.message.includes("can only send to your own email address")) {
      throw new Error("During testing with onboarding@resend.dev, emails can only be sent to nvsjewellery@gmail.com.");
    }

    throw new Error(error.message || "Failed to send reset email");
  }

  return data;
};

module.exports = sendEmail;