const nodemailer = require("nodemailer");
const pug = require("pug");
const { htmlToText } = require("html-to-text");

module.exports = class Email {
  constructor(user) {
    this.to = user.email;
    this.username = user.username;
    this.from = `Juan Torres <${process.env.EMAIL_FROM}>`;
    this.language = user.language;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    // The service that will send the email
    if (process.env.NODE_ENV === "development") {
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
  }

  async send(template, subject, options = {}) {
    // Send the actual email
    // 1) Render the HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.username,
      subject,
      ...options,
    });

    // 2) Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    // 3) Create a transport and send the email
    try {
      await this.newTransport().sendMail(mailOptions);
    } catch (error) {
      console.log("Error sending email:", error);
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
    // NOTE: in this method this.language is not used because the
    // user will not be logged in.
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
