const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

/**
 * Send a verification email.
 * If RESEND_API_KEY is not set, logs the link to console (dev mode).
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  walletAddress: string
): Promise<void> {
  const verifyUrl = `${FRONTEND_URL}/verify?token=${token}`;

  if (!RESEND_API_KEY) {
    console.log("\n══════════════════════════════════════════════");
    console.log("  VERIFICATION EMAIL (dev mode - no Resend key)");
    console.log(`  To: ${email}`);
    console.log(`  Wallet: ${walletAddress}`);
    console.log(`  Link: ${verifyUrl}`);
    console.log("══════════════════════════════════════════════\n");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(RESEND_API_KEY);

  await resend.emails.send({
    from: "Vaultis <onboarding@resend.dev>",
    to: email,
    subject: "Vaultis - Vérifiez votre email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; margin: 0;">Vaultis</h1>
          <p style="color: #666; margin-top: 5px;">Tokenized Luxury Watch Platform</p>
        </div>
        <div style="background: #111; border-radius: 12px; padding: 30px; border: 1px solid #333;">
          <h2 style="color: #fff; margin-top: 0;">Vérifiez votre email</h2>
          <p style="color: #aaa;">
            Vous avez demandé à vérifier votre wallet <code style="color: #C9A84C;">${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}</code> sur Vaultis.
          </p>
          <p style="color: #aaa;">
            Cliquez sur le bouton ci-dessous pour activer votre compte et être whitelisté sur la blockchain.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: #C9A84C; color: #111; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Vérifier mon email
            </a>
          </div>
          <p style="color: #666; font-size: 13px;">
            Ce lien expire dans 24 heures. Si vous n'avez pas fait cette demande, ignorez cet email.
          </p>
        </div>
      </div>
    `,
  });
}
