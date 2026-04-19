export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fname, lname, email, phone, service, message } = req.body;

  // Validation
  if (!fname || !lname || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'romeonacu777@gmail.com',
        replyTo: email,
        subject: `Ofertă - ${service || 'Consultație'} - de la ${fname} ${lname}`,
        html: `
          <h2>Cerere de ofertă de la Rosher Words</h2>
          <p><strong>Nume:</strong> ${fname} ${lname}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
          ${service ? `<p><strong>Serviciu de interes:</strong> ${service}</p>` : ''}
          <p><strong>Mesaj:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p style="color: #999; font-size: 12px;">Trimis de pe site-ul Rosher Words</p>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', JSON.stringify(data));
      console.error('Response status:', response.status);
      console.error('API Key present:', !!process.env.RESEND_API_KEY);
      return res.status(500).json({ error: 'Failed to send email', details: data });
    }

    console.log('Email sent successfully:', data.id);
    return res.status(200).json({
      success: true,
      message: 'Email trimis cu succes!',
      id: data.id
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
