import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as sgMail from "@sendgrid/mail";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("SENDGRID_API_KEY");
    if (!apiKey) {
      this.logger.warn("SENDGRID_API_KEY no está configurada");
    } else {
      sgMail.setApiKey(apiKey);
      this.logger.log("SendGrid configurado correctamente");
    }
  }

  async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    firstName: string,
  ): Promise<void> {
    const fromName =
      this.configService.get<string>("EMAIL_FROM_NAME") || "DCTI Pass";
    const fromEmail =
      this.configService.get<string>("EMAIL_FROM") || "noreply@dctipass.com";

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #113780, #0C2A5C); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0; letter-spacing: 2px;">DCTI Pass</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 8px;">Recuperación de Contraseña</p>
          </div>
          
          <!-- Body -->
          <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            <p style="font-size: 16px; color: #333; margin-bottom: 8px;">Hola <strong>${firstName}</strong>,</p>
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 24px;">
              Recibimos una solicitud para restablecer tu contraseña en DCTI Pass. 
              Haz clic en el botón de abajo para crear una nueva contraseña.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #113780, #0C2A5C); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 16px; font-weight: bold; letter-spacing: 0.5px;">
                Restablecer Contraseña
              </a>
            </div>
            
            <!-- Info -->
            <div style="background-color: #f8f9fb; border-left: 4px solid #113780; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
              <p style="font-size: 13px; color: #555; margin: 0; line-height: 1.5;">
                ⏰ Este enlace expirará en <strong>1 hora</strong> por razones de seguridad.<br>
                🔒 Si no realizaste esta solicitud, ignora este correo y tu contraseña permanecerá igual.
              </p>
            </div>
            
            <!-- Fallback link -->
            <p style="font-size: 12px; color: #888; margin-top: 24px; word-break: break-all;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${resetLink}" style="color: #113780;">${resetLink}</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} DCTI Pass. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const msg = {
        to,
        from: { email: fromEmail, name: fromName },
        subject: "🔑 Restablecer tu contraseña - DCTI Pass",
        html,
      };

      await sgMail.send(msg);
      this.logger.log(`✅ Email enviado exitosamente a ${to}`);
    } catch (err: any) {
      const errorBody = err?.response?.body || err.message;
      this.logger.error(
        "❌ Error enviando email con SendGrid:",
        JSON.stringify(errorBody),
      );
      throw new Error(`Error al enviar email: ${JSON.stringify(errorBody)}`);
    }
  }
}
