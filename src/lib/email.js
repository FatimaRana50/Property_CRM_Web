import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email when a new lead is created
 */
export async function sendNewLeadEmail(lead, agentEmail) {
  const priorityColor = {
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#10b981',
  }[lead.priority] || '#6b7280';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a8a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">🏠 New Lead Received</h2>
        <p style="margin: 5px 0 0; opacity: 0.8;">Property Dealer CRM System</p>
      </div>
      <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
        <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
          <h3 style="color: #1e293b; margin-top: 0;">Client Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; width: 40%;">Name</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${lead.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;">Phone</td>
              <td style="padding: 8px 0; color: #1e293b;">${lead.phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;">Email</td>
              <td style="padding: 8px 0; color: #1e293b;">${lead.email || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;">Property Interest</td>
              <td style="padding: 8px 0; color: #1e293b;">${lead.propertyInterest}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;">Budget</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">
                PKR ${(lead.budget / 1000000).toFixed(1)}M
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Priority</td>
              <td style="padding: 8px 0;">
                <span style="background: ${priorityColor}; color: white; padding: 3px 10px; border-radius: 20px; font-size: 13px;">
                  ${lead.priority}
                </span>
              </td>
            </tr>
          </table>
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center;">
          Login to CRM to manage this lead
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: agentEmail,
      subject: `🏠 New ${lead.priority} Priority Lead: ${lead.name}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send new lead email:', error);
  }
}

/**
 * Send email when a lead is assigned to an agent
 */
export async function sendLeadAssignmentEmail(lead, agent) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">📋 Lead Assigned to You</h2>
        <p style="margin: 5px 0 0; opacity: 0.8;">Property Dealer CRM System</p>
      </div>
      <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
        <div style="background: white; border-radius: 8px; padding: 20px;">
          <p style="color: #1e293b;">Hi <strong>${agent.name}</strong>,</p>
          <p style="color: #475569;">A new lead has been assigned to you. Please review the details and follow up promptly.</p>
          <h3 style="color: #1e293b; border-top: 1px solid #e2e8f0; padding-top: 15px;">Lead Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; width: 40%;">Client Name</td>
              <td style="padding: 8px 0; font-weight: bold;">${lead.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;">Phone</td>
              <td style="padding: 8px 0;">${lead.phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;">Property Interest</td>
              <td style="padding: 8px 0;">${lead.propertyInterest}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Budget</td>
              <td style="padding: 8px 0; font-weight: bold;">PKR ${(lead.budget / 1000000).toFixed(1)}M</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #059669;">
            <p style="margin: 0; color: #065f46; font-size: 14px;">
              💡 <strong>Tip:</strong> Contact this lead within 24 hours for best conversion rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: agent.email,
      subject: `📋 New Lead Assigned: ${lead.name}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send assignment email:', error);
  }
}
