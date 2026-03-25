import AgentApprovalStatusEmail from '@/emails/AgentApprovalStatusEmail';
import sgMail from '@sendgrid/mail';
import { render } from '@react-email/render';
import AgentInviteEmail from '@/emails/AgentInviteEmail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
const PLATFORM_DOMAIN = 'rexonproperties.in';

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



interface SendAgentInviteEmailParams {
  fullName: string;
  email: string;
  temporaryPassword: string;
  agencyName?: string;
  city?: string;
  domainName?: string;
}

export async function sendAgentInviteEmail({
  fullName,
  email,
  temporaryPassword,
  agencyName,
  city,
  domainName
}: SendAgentInviteEmailParams) {
  try {
   
    const fullDomainUrl = domainName && domainName.trim()
      ? `https://${domainName}.${PLATFORM_DOMAIN}`
      : `https://rexon-crm.vercel.app`;

    console.log('🔐 Agent Invite Email Debug:', {
      received_domainName: domainName,
      is_domainName_truthy: !!domainName,
      is_domainName_trimmed: domainName?.trim(),
      constructed_fullDomainUrl: fullDomainUrl,
    });

    const emailHtml = await render(
      AgentInviteEmail({ 
        fullName, 
        email, 
        temporaryPassword, 
        agencyName, 
        city, 
        domainName: domainName || '' 
      })
    );

    // ── SendGrid message configuration ─────────────────────────────────────
    const msg = {
      to: email,
      from: 'admin@rexonproperties.in',
      subject: `Your Rexon Agent Dashboard credentials are ready`,
      html: emailHtml,
      text: `Hi ${fullName}, your Rexon Agent Dashboard account has been created.\n\nEmail: ${email}\nTemporary Password: ${temporaryPassword}\n\nLogin at: ${fullDomainUrl}\n\nPlease change your password after your first login.`,
      categories: ['agent-onboarding', 'agent-invite'],
      customArgs: {
        email_type: 'agent-invite',
        agent_name: fullName,
        domain_name: domainName || 'no-domain-provided',
      },
    };

    const response = await sgMail.send(msg);

    console.log('✅ Agent invite email sent successfully via SendGrid');
    console.log('📧 Email details:', {
      to: email,
      domainUrl: fullDomainUrl,
      statusCode: response[0].statusCode,
      messageId: response[0].headers['x-message-id'],
    });

    return {
      success: true,
      data: {
        statusCode: response[0].statusCode,
        messageId: response[0].headers['x-message-id'],
      },
    };
  } catch (error: any) {
    console.error('❌ Failed to send agent invite email via SendGrid:', error);
    if (error.response) {
      console.error('SendGrid Error Body:', error.response.body);
    }
    return {
      success: false,
      error: error.message || 'Failed to send agent invite email',
    };
  }
}