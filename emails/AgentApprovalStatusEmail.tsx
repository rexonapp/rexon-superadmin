import {
    Body,
    Container,
    Column,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Row,
    Section,
    Text,
    Hr,
  } from "@react-email/components";
  import * as React from "react";
  
  interface AgentApprovalStatusEmailProps {
    fullName: string;
    email: string;
    status: "approved" | "rejected";
    dashboardUrl?: string;
    reason?: string;
  }
  
  export const AgentApprovalStatusEmail = ({
    fullName,
    email,
    status,
    dashboardUrl = "http://rexon-crm.vercel.app/login",
    reason = "",
  }: AgentApprovalStatusEmailProps) => {
    const isApproved = status === "approved"; 
  
    const previewText = isApproved
      ? "Your Rexon agent account has been approved"
      : "Update regarding your Rexon agent application";
  
    return (
      <Html>
        <Head />
        <Preview>{previewText}</Preview>
  
        <Body style={main}>
          <Container style={container}>
  
            {/* Header */}
            <Section style={header}>
              <Row>
                <Column>
                  <Heading style={logoText}>REXON</Heading>
                  <Text style={logoTagline}>Real Estate Excellence</Text>
                </Column>
  
                <Column style={{ textAlign: "right" }}>
                  <Text style={headerBadge}>Agent Portal</Text>
                </Column>
              </Row>
            </Section>
  
            <Section style={accentBar} />
  
            {/* Hero */}
            <Section style={heroSection}>
              <Text style={welcomeLabel}>
                {isApproved ? "APPLICATION APPROVED" : "APPLICATION UPDATE"}
              </Text>
  
              <Heading style={heroHeading}>
                Hello {fullName}
              </Heading>
  
              <Text style={heroSubtext}>
                {isApproved
                  ? "Congratulations! Your Rexon agent account has been approved."
                  : "We reviewed your agent application and unfortunately it was not approved at this time."}
              </Text>
            </Section>
  
            {/* Content */}
            <Section style={content}>
  
              {/* Account Details */}
              <Section style={credentialsCard}>
                <Text style={cardLabel}>AGENT DETAILS</Text>
  
                <Hr style={divider} />
  
                <Row style={detailRow}>
                  <Column style={detailLabel}>Full Name</Column>
                  <Column style={detailValue}>{fullName}</Column>
                </Row>
  
                <Hr style={thinDivider} />
  
                <Row style={detailRow}>
                  <Column style={detailLabel}>Email</Column>
                  <Column style={detailValue}>{email}</Column>
                </Row>
  
                <Hr style={thinDivider} />
  
                <Row style={detailRow}>
                  <Column style={detailLabel}>Status</Column>
                  <Column>
                    <Text
                      style={{
                        ...statusBadge,
                        backgroundColor: isApproved ? "#dcfce7" : "#fee2e2",
                        color: isApproved ? "#166534" : "#991b1b",
                        border: "none",
                      }}
                    >
                      {isApproved ? "Approved" : "Rejected"}
                    </Text>
                  </Column>
                </Row>
              </Section>
  
              {/* Rejection reason */}
              {!isApproved && reason && (
                <Section style={securityCard}>
                  <Text style={securityTitle}>Reason</Text>
                  <Text style={securityBody}>{reason}</Text>
                </Section>
              )}
  
              {/* CTA */}
              {isApproved && (
                <Section style={ctaSection}>
                  <Link href={dashboardUrl} style={ctaButton}>
                    Login to Dashboard →
                  </Link>
                </Section>
              )}
  
              {/* Help */}
              <Section style={helpSection}>
                <Text style={helpBody}>
                  If you have any questions, please contact our support team at{" "}
                  <Link href="mailto:support@rexon.com" style={helpLink}>
                    support@rexon.com
                  </Link>
                  .
                </Text>
              </Section>
  
            </Section>
  
            {/* Footer */}
            <Section style={footer}>
              <Hr style={footerDivider} />
  
              <Text style={footerText}>
                © {new Date().getFullYear()} Rexon Realty Pvt. Ltd. · All rights reserved.
              </Text>
  
              <Text style={footerUnsubscribe}>
                <Link href="#" style={unsubLink}>
                  Privacy Policy
                </Link>
                {" · "}
                <Link href="#" style={unsubLink}>
                  Terms of Service
                </Link>
              </Text>
            </Section>
  
          </Container>
        </Body>
      </Html>
    );
  };
  
  export default AgentApprovalStatusEmail;


  /* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */

const main = {
    backgroundColor: '#eef2f7',
    fontFamily: 'Georgia, "Times New Roman", serif',
  };
  
  const container = {
    backgroundColor: '#ffffff',
    margin: '24px auto',
    maxWidth: '580px',
    borderRadius: '4px',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(30,58,120,0.10)',
  };
  
  const header = {
    backgroundColor: '#1d4ed8',
    padding: '20px 32px',
  };
  
  const logoText = {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: '700',
    margin: '0',
    letterSpacing: '4px',
    fontFamily: 'Georgia, serif',
  };
  
  const logoTagline = {
    color: '#93c5fd',
    fontSize: '10px',
    letterSpacing: '2px',
    margin: '2px 0 0',
    textTransform: 'uppercase' as const,
  };
  
  const headerBadge = {
    display: 'inline-block',
    backgroundColor: '#f97316',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '1px',
    padding: '4px 10px',
    borderRadius: '20px',
    margin: '0',
  };
  
  const accentBar = {
    backgroundColor: '#f97316',
    height: '3px',
    padding: '0',
    margin: '0',
  };
  
  const heroSection = {
    backgroundColor: '#eff6ff',
    padding: '28px 40px 24px',
    textAlign: 'center' as const,
  };
  
  const welcomeLabel = {
    color: '#3b82f6',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '3px',
    margin: '0 0 10px',
  };
  
  const heroHeading = {
    color: '#1e3a8a',
    fontSize: '26px',
    fontWeight: '700',
    margin: '0 0 10px',
    lineHeight: '1.2',
    fontFamily: 'Georgia, serif',
  };
  
  const heroSubtext = {
    color: '#374151',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0',
  };
  
  const content = {
    padding: '28px 36px',
  };
  
  /* Credentials card */
  const credentialsCard = {
    backgroundColor: '#f0f7ff',
    borderRadius: '6px',
    padding: '20px 20px 16px',
    marginBottom: '16px',
    border: '1px solid #bfdbfe',
  };
  
  const cardAccentBarStyle = {
    backgroundColor: '#3b82f6',
    width: '4px',
    borderRadius: '4px',
  };
  
  const cardLabel = {
    color: '#3b82f6',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '2px',
    margin: '0 0 2px',
  };
  
  const cardHeading = {
    color: '#1e3a8a',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0',
    fontFamily: 'Georgia, serif',
  };
  
  const divider = {
    borderColor: '#dbeafe',
    margin: '14px 0 12px',
  };
  
  const thinDivider = {
    borderColor: '#e8f0fe',
    margin: '8px 0',
  };
  
  const detailRow = {
    padding: '4px 0',
  };
  
  const detailLabel = {
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: '500',
    width: '130px',
  };
  
  const detailValue = {
    color: '#1e3a8a',
    fontSize: '12px',
    fontWeight: '600',
  };
  
  const passwordBadge = {
    display: 'inline-block',
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'Courier New, Courier, monospace',
    letterSpacing: '3px',
    padding: '6px 14px',
    borderRadius: '4px',
    margin: '0',
  };
  
  const dashboardLinkInline = {
    color: '#f97316',
    fontSize: '12px',
    fontWeight: '600',
    textDecoration: 'underline',
  };
  
  /* Security card */
  const securityCard = {
    backgroundColor: '#fff7ed',
    borderRadius: '6px',
    padding: '14px 18px',
    marginBottom: '16px',
    border: '1px solid #fed7aa',
  };
  
  const securityIconCol = {
    width: '32px',
    verticalAlign: 'top',
  };
  
  const securityIcon = {
    fontSize: '16px',
    margin: '1px 0 0',
  };
  
  const securityTitle = {
    color: '#9a3412',
    fontSize: '13px',
    fontWeight: '700',
    margin: '0 0 4px',
  };
  
  const securityBody = {
    color: '#7c2d12',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '0',
  };
  
  /* Account summary card */
  const accountCard = {
    backgroundColor: '#f8faff',
    borderRadius: '6px',
    padding: '18px 20px 14px',
    marginBottom: '20px',
    border: '1px solid #dbeafe',
  };
  
  const statusBadge = {
    display: 'inline-block',
    backgroundColor: '#fef9c3',
    color: '#854d0e',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    padding: '3px 8px',
    borderRadius: '20px',
    border: '1px solid #fde047',
    margin: '0',
  };
  
  /* CTA */
  const ctaSection = {
    textAlign: 'center' as const,
    padding: '20px 0 4px',
  };
  
  const ctaButton = {
    backgroundColor: '#f97316',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    textDecoration: 'none',
    display: 'inline-block',
    padding: '13px 32px',
    letterSpacing: '0.5px',
  };
  
  /* Help */
  const helpSection = {
    borderRadius: '6px',
    padding: '14px 16px',
    marginTop: '20px',
    border: '1px solid #fed7aa',
    backgroundColor: '#fffbf5',
  };
  
  const helpBody = {
    color: '#374151',
    fontSize: '12px',
    lineHeight: '1.6',
    margin: '0',
  };
  
  const helpLink = {
    color: '#f97316',
    textDecoration: 'underline',
  };
  
  /* Footer */
  const footer = {
    padding: '20px 36px 28px',
    backgroundColor: '#1e3a8a',
  };
  
  const footerDivider = {
    borderColor: '#2d4fa3',
    margin: '0 0 16px',
  };
  
  const footerText = {
    color: '#93c5fd',
    fontSize: '11px',
    lineHeight: '1.6',
    margin: '0 0 4px',
    textAlign: 'center' as const,
  };
  
  const footerUnsubscribe = {
    color: '#60a5fa',
    fontSize: '10px',
    margin: '10px 0 0',
    textAlign: 'center' as const,
  };
  
  const unsubLink = {
    color: '#60a5fa',
    textDecoration: 'none',
  };