type SendEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(apiKey: string | undefined, payload: SendEmailPayload): Promise<void> {
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured — skipping email send');
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Grill Me Jerseys <no-reply@grillme.com>',
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${errorText}`);
  }
}

export async function sendOtpEmail(apiKey: string | undefined, to: string, otp: string): Promise<void> {
  await sendEmail(apiKey, {
    to,
    subject: 'Your Grill Me verification code',
    text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: #c8f500; padding: 24px 32px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #0a0a0a; letter-spacing: -1px; text-transform: uppercase;">GRILL ME</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #0a0a0a; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Order Verification</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #a1a1aa; font-size: 15px; margin: 0 0 24px;">Use the code below to confirm your purchase. It expires in <strong style="color: #ffffff;">10 minutes</strong>.</p>
          <div style="background: #1a1a1a; border: 2px solid #c8f500; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #a1a1aa; letter-spacing: 3px; text-transform: uppercase;">Your code</p>
            <p style="margin: 0; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #c8f500;">${otp}</p>
          </div>
          <p style="color: #71717a; font-size: 13px; margin: 0;">If you did not initiate this purchase, please ignore this email.</p>
        </div>
      </div>
    `,
  });
}
