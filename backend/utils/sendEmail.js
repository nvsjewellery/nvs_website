const { Resend } = require("resend");

const sendEmail = async ({ email, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY missing in environment variables!");
    throw new Error("Email service is not configured on the server.");
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: "NVS Jewellery <care@nvsjewellery.com>",
    to: [email],
    subject,
    html,
  });

  if (error) {
    console.error("❌ Resend Email Error:", error);
    throw new Error(error.message || "Failed to send email");
  }

  return data;
};

module.exports = sendEmail;