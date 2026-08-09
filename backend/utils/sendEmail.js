const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ email, subject, html }) => {
  const { data, error } = await resend.emails.send({
    from: "NVS Jewellery <onboarding@resend.dev>",
    to: [email],
    subject,
    html,
  });

  if (error) {
    console.error("Resend Email Error:", error);
    throw new Error(error.message || "Failed to send reset email");
  }

  return data;
};

module.exports = sendEmail;