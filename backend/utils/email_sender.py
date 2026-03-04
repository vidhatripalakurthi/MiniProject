import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")


def send_otp_email(receiver_email, otp):

    subject = "TrendCast Password Reset OTP"

    body = f"""
Hello,

Your OTP for resetting your TrendCast password is:

{otp}

This OTP will expire in 10 minutes.

If you did not request this password reset, please ignore this email.

Regards,
TrendCast Team
"""

    msg = MIMEMultipart()
    msg["From"] = EMAIL_USER
    msg["To"] = receiver_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()

        server.login(EMAIL_USER, EMAIL_PASS)

        server.sendmail(
            EMAIL_USER,
            receiver_email,
            msg.as_string()
        )

        server.quit()

        return True

    except Exception as e:
        print("Email error:", e)
        return False