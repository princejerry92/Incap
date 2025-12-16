import inspect
from mailersend import MailerSendClient, EmailRequest, EmailContact
from ..core.config import settings

class EmailService:
    """Service for sending emails using MailerSend."""

    def __init__(self):
        self.client = MailerSendClient(settings.MAILERSEND_API)

    def send_password_reset_email(self, recipient_email: str, reset_code: str):
        """
        Send password reset email with reset code.

        Args:
            recipient_email: The email address of the recipient
            reset_code: The 6-digit reset code to send
        """
        try:
            personalization = [
                {
                    "email": recipient_email,
                    "data": {
                        "reset_code": reset_code,
                        "email": recipient_email
                    }
                }
            ]

            email_request = EmailRequest(
                **{
                    "from": EmailContact(
                        email="bmvcustomerservice92@gmail.com",
                        name="Blue Gold Investments"
                    ),
                    "to": [EmailContact(email=recipient_email, name="Dear User")],
                    "subject": "Password Reset Code",
                    "template_id": "z3m5jgreopoldpyo",
                    "personalization": personalization
                }
            )

            response = self.client.emails.send(email_request)
            return response
        except Exception as e:
            raise Exception(f"Failed to send email: {str(e)}")

    def send_account_deletion_email(self, recipient_email: str):
        """
        Send account deletion confirmation email.

        Args:
            recipient_email: The email address of the recipient
        """
        try:
            personalization = [
                {
                    "email": recipient_email,
                    "data": {
                        "email": recipient_email
                    }
                }
            ]

            email_request = EmailRequest(
                **{
                    "from": EmailContact(
                        email="bmvcustomerservice92@gmail.com",
                        name="Blue Gold Investments"
                    ),
                    "to": [EmailContact(email=recipient_email, name="User")],
                    "subject": "Account Deletion Confirmation",
                    "template_id": "123456789",  # Placeholder string template ID
                    "personalization": personalization
                }
            )

            response = self.client.emails.send(email_request)
            return response
        except Exception as e:
            raise Exception(f"Failed to send email: {str(e)}")

    def send_password_reset_success_email(self, recipient_email: str):
        """
        Send password reset success email.

        Args:
            recipient_email: The email address of the recipient
        """
        try:
            personalization = [
                {
                    "email": recipient_email,
                    "data": {
                        "email": recipient_email
                    }
                }
            ]

            email_request = EmailRequest(
                **{
                    "from": EmailContact(
                        email="bmvcustomerservice92@gmail.com",
                        name="Blue Gold Investments"
                    ),
                    "to": [EmailContact(email=recipient_email, name="User")],
                    "subject": "Password Reset Successful",
                    "template_id": "123456789",  # Placeholder string template ID
                    "personalization": personalization
                }
            )

            response = self.client.emails.send(email_request)
            return response
        except Exception as e:
            raise Exception(f"Failed to send email: {str(e)}")