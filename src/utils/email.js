const nodemailer = require("nodemailer");
const pug = require("pug");
const { htmlToText } = require("html-to-text");
const sgMail = require("@sendgrid/mail");

module.exports = class Email {
  constructor(user) {
    this.to = user.email;
    this.username = user.username;
    this.from = `Juan Torres <${process.env.EMAIL_FROM}>`;
    this.language = user.language;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid via HTTP API
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      return null; // no transporter needed
    }

    // SMTP (Mailtrap u otro)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      logger: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject, options = {}) {
    // 1) Render the HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.username,
      subject,
      ...options,
    });

    const text = htmlToText(html);

    try {
      if (process.env.NODE_ENV === "production") {
        await sgMail.send({
          to: this.to,
          from: this.from,
          subject,
          html,
          text,
        });
      } else {
        const transport = this.newTransport();

        await transport.sendMail({
          from: this.from,
          to: this.to,
          subject,
          html,
          text,
        });
      }
    } catch (error) {
      console.log("Error sending email:", error);
      throw error;
    }
  }

  async sendWelcome() {
    if (this.language === "es") {
      await this.send("welcome-es", "¡Bienvenido a Trackoverload!");
    } else {
      await this.send("welcome-en", "Welcome to Trackoverload!");
    }
  }

  async sendPasswordReset(url, lang = "en") {
    if (lang === "es") {
      await this.send(
        "passwordReset-es",
        "Tu token de restablecimiento de contraseña (válido solo por 10 minutos)",
        { url }
      );
    } else {
      await this.send(
        "passwordReset-en",
        "Your password reset token (valid for only 10 minutes)",
        { url }
      );
    }
  }
};
