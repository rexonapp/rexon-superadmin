import AgentApprovalStatusEmail from '@/emails/AgentApprovalStatusEmail';
import sgMail from '@sendgrid/mail';
import { render } from '@react-email/render';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface SendAgentStatusEmailParams {
    fullName: string;
    email: string;
    status: "approved" | "rejected";
    reason?: string;
  }
  
  export async function sendAgentStatusEmail({
    fullName,
    email,
    status,
    reason,
  }: SendAgentStatusEmailParams) {
    try {
      const emailHtml = await render(
        AgentApprovalStatusEmail({
          fullName,
          email,
          status,
          reason,
        })
      );
  
      const msg = {
        to: email,
        from: 'admin@rexonproperties.in',
        subject:
          status === "approved"
            ? "Your Rexon Agent Access Has Been Approved"
            : "Update Regarding Your Rexon Agent Application",
        html: emailHtml,
        text:
          status === "approved"
            ? `Hi ${fullName}, your Rexon agent account has been approved. You can now login to the dashboard.`
            : `Hi ${fullName}, your request for agent access has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
        categories: ['agent-status-update'],
        customArgs: {
          email_type: 'agent-status',
          agent_name: fullName,
          status: status,
        },
      };
  
      const response = await sgMail.send(msg);
  
      console.log('Agent status email sent successfully');
      console.log('SendGrid Response:', response[0].statusCode);
  
      return {
        success: true,
        data: {
          statusCode: response[0].statusCode,
          messageId: response[0].headers['x-message-id'],
        },
      };
    } catch (error: any) {
      console.error('Failed to send agent status email:', error);
  
      if (error.response) {
        console.error('SendGrid Error Body:', error.response.body);
      }
  
      return {
        success: false,
        error: error.message || 'Failed to send agent status email',
      };
    }
  }