export function generateEmailContent(formData, barbeiro, servico, reservaId) {
    const [ano, mes, dia] = formData.data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    // Gerar ficheiro .ics
    const [anoNum, mesNum, diaNum] = formData.data.split('-');
    const [horaNum, minNum] = formData.hora.split(':');

    const dtStart = `${anoNum}${mesNum}${diaNum}T${horaNum}${minNum}00Z`;
    const horaFimNum = String(parseInt(horaNum) + 1).padStart(2, '0');
    const dtEnd = `${anoNum}${mesNum}${diaNum}T${horaFimNum}${minNum}00Z`;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Brooklyn Barbearia//Reservas//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:reserva-${reservaId}@brooklyn.tiagoanoliveira.pt
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:Reserva - ${servico.nome} com ${barbeiro.nome}
DESCRIPTION:Confirmação de reserva na Brooklyn Barbearia
LOCATION:Brooklyn Barbearia
ORGANIZER:CN=Brooklyn Barbearia:mailto:noreply@brooklyn.tiagoanoliveira.pt
ATTENDEE:mailto:${formData.email}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

    const baseURL = 'https://brooklyn.tiagoanoliveira.pt';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                ${getEmailCSS()}
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="container">
                    <!-- Logo -->
                    <div class="logo-section">
                        <img src="${baseURL}/images/logo-512px.png" alt="Brooklyn Barbearia" class="logo" />
                    </div>
                    
                    <!-- Header -->
                    <div class="header">
                        <h1>Reserva Confirmada!</h1>
                    </div>
                    
                    <!-- Content -->
                    <div class="content">
                        <p>Olá <strong>${formData.nome}</strong>,</p>
                        <p>A sua reserva foi confirmada com sucesso. Aqui estão os detalhes:</p>
                        
                        <div class="detail">
                            <strong>📅 Data:</strong> ${dataFormatada}
                        </div>
                        <div class="detail">
                            <strong>🕐 Hora:</strong> ${formData.hora}
                        </div>
                        <div class="detail">
                            <strong>✂️ Serviço:</strong> ${servico.nome}
                        </div>
                        <div class="detail">
                            <strong>👤 Barbeiro:</strong> ${barbeiro.nome}
                        </div>
                        ${formData.telefone ? `
                        <div class="detail">
                            <strong>📱 Telefone:</strong> ${formData.telefone}
                        </div>
                        ` : ''}
                        ${formData.comentario ? `
                        <div class="detail">
                            <strong>💬 Comentário:</strong> ${formData.comentario}
                        </div>
                        ` : ''}
                        
                        <p style="margin-top: 30px;">Aguardamos por si! Se precisar de cancelar ou reagendar, por favor contacte-nos.</p>
                        <p class="calendar-note">📞 +351 224 938 542</p>
                    </div>
                    
                    <!-- Footer -->
                    <div class="footer">
                        <p>Este é um email automático, por favor não responda.</p>
                        <p>© ${new Date().getFullYear()} Brooklyn Barbearia. Todos os direitos reservados. Website feito com 🤍 por <a href="https://www.linkedin.com/in/tiagoalexoliveira/">Tiago Oliveira</a>.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    return {
        html: htmlContent,
        ics: icsContent
    };
}

function getEmailCSS() {
    return `
        /* Reset */
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        /* Wrapper com background */
        .email-wrapper {
            background-color: #f5f5f5;
            background-image: url('https://brooklyn.tiagoanoliveira.pt/images/background-email.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            padding: 40px 20px;
            min-height: 100vh;
        }

        
        /* Container principal */
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(45, 74, 62, 0.1);
        }
        
        /* Seção do logo */
        .logo-section {
            background-color: #2d4a3e;
            text-align: center;
            padding: 30px 20px;
        }
        
        .logo {
            max-width: 80px;
            height: auto;
            display: inline-block;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #2d4a3e 0%, #3d5a4e 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 4px solid #d4af7a;
        }
        
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        /* Content */
        .content {
            background-color: #ffffff;
            padding: 40px 30px;
        }
        
        .content p {
            margin: 15px 0;
            color: #333333;
            font-size: 16px;
        }
        
        .content strong {
            color: #2d4a3e;
        }
        
        /* Detail boxes */
        .detail {
            margin: 15px 0;
            padding: 15px 20px;
            background-color: #f5f5f5;
            border-left: 5px solid #d4af7a;
            border-radius: 5px;
            transition: all 0.3s ease;
        }
        
        .detail strong {
            color: #2d4a3e;
            font-weight: 600;
            display: inline-block;
            min-width: 100px;
        }
        
        /* Calendar note */
        .calendar-note {
            margin-top: 25px;
            padding: 15px;
            background-color: #fff9f0;
            border: 1px solid #d4af7a;
            border-radius: 8px;
            font-size: 14px;
            color: #666666;
            text-align: center;
        }
        
        /* Footer */
        .footer {
            background-color: #1a1a1a;
            color: #999999;
            text-align: center;
            padding: 25px 20px;
            font-size: 13px;
        }
        
        .footer p {
            margin: 8px 0;
        }
        
        /* Responsividade */
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 20px 10px;
            }
            
            .container {
                border-radius: 8px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .detail {
                padding: 12px 15px;
            }
            
            .detail strong {
                display: block;
                margin-bottom: 5px;
            }
            
            .logo {
                max-width: 150px;
            }
        }
        
        /* Suporte para dark mode (opcional) */
        @media (prefers-color-scheme: dark) {
            .email-wrapper {
                background-color: #1a1a1a;
            }
        }
    `;
}
