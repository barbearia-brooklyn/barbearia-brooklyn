/**
 * Template de email para cancelamento de reservas
 * Design cozy, moderno e minimalista
 */

export function generateCancellationEmailContent(reserva, cliente, barbeiro, servico, motivo) {
    const [ano, mes, dia] = reserva.data_hora.split('T')[0].split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const horaFormatada = reserva.data_hora.split('T')[1].substring(0, 5);

    // Gerar ficheiro .ics de cancelamento
    const [anoNum, mesNum, diaNum] = reserva.data_hora.split('T')[0].split('-');
    const [horaNum, minNum] = reserva.data_hora.split('T')[1].split(':');

    const dtStart = `${anoNum}${mesNum}${diaNum}T${horaNum}${minNum}00Z`;
    const horaFimNum = String(parseInt(horaNum) + 1).padStart(2, '0');
    const dtEnd = `${anoNum}${mesNum}${diaNum}T${horaFimNum}${minNum}00Z`;

    // ICS com METHOD:CANCEL para cancelar no calendário do cliente
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Brooklyn Barbearia//Reservas//EN
CALSCALE:GREGORIAN
METHOD:CANCEL
BEGIN:VEVENT
UID:reserva-${reserva.id}@brooklynbarbearia.pt
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:CANCELADA - ${servico.nome} com ${barbeiro.nome}
DESCRIPTION:Esta reserva foi cancelada pela Brooklyn Barbearia
LOCATION:Brooklyn Barbearia
ORGANIZER:CN=Brooklyn Barbearia:mailto:noreply@brooklynbarbearia.pt
ATTENDEE:mailto:${cliente.email}
STATUS:CANCELLED
SEQUENCE:1
END:VEVENT
END:VCALENDAR`;

    const baseURL = 'https://brooklynbarbearia.pt/';

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt">
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
                        <img src="${baseURL}images/logo-512px.png" alt="Brooklyn Barbearia" class="logo" />
                    </div>
                    
                    <!-- Header -->
                    <div class="header-cancelled">
                        <div class="icon-cancelled">❌</div>
                        <h1>Reserva Cancelada</h1>
                    </div>
                    
                    <!-- Content -->
                    <div class="content">
                        <p>Olá <strong>${cliente.nome}</strong>,</p>
                        <p>Lamentamos informar que a sua reserva foi <strong>cancelada</strong>.</p>
                        
                        <div class="info-box cancelled-info">
                            <h3>Detalhes da Reserva Cancelada</h3>
                            <div class="detail-row">
                                <span class="detail-icon">📅</span>
                                <div class="detail-content">
                                    <strong>Data:</strong> ${dataFormatada}
                                </div>
                            </div>
                            <div class="detail-row">
                                <span class="detail-icon">🕕</span>
                                <div class="detail-content">
                                    <strong>Hora:</strong> ${horaFormatada}
                                </div>
                            </div>
                            <div class="detail-row">
                                <span class="detail-icon">✂️</span>
                                <div class="detail-content">
                                    <strong>Serviço:</strong> ${servico.nome}
                                </div>
                            </div>
                            <div class="detail-row">
                                <span class="detail-icon">👤</span>
                                <div class="detail-content">
                                    <strong>Barbeiro:</strong> ${barbeiro.nome}
                                </div>
                            </div>
                        </div>
                        
                        ${motivo ? `
                        <div class="info-box reason-box">
                            <h3>Motivo do Cancelamento</h3>
                            <p class="reason-text">${motivo}</p>
                        </div>
                        ` : ''}
                        
                        <div class="cta-section">
                            <p class="cta-text">Pedimos desculpa pelo inconveniente. Pode fazer uma nova reserva a qualquer momento:</p>
                            <a href="${baseURL}reservas.html" class="btn-primary">Fazer Nova Reserva</a>
                        </div>
                        
                        <div class="contact-section">
                            <p>Se tiver alguma dúvida ou pretender reagendar, não hesite em contactar-nos:</p>
                            <div class="contact-info">
                                <a href="tel:+351224938542" class="contact-link">
                                    <span class="contact-icon">📞</span>
                                    +351 224 938 542
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="footer">
                        <p>Brooklyn Barbearia</p>
                        <p class="footer-small">Este é um email automático, por favor não responda.</p>
                        <p>&copy; ${new Date().getFullYear()} Brooklyn Barbearia - Todos os direitos reservados. Feito com 🤍 por <a href="https://www.tiagoanoliveira.pt">Tiago Oliveira</a>.</p>
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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background-color: #f8f9fa;
        }
        
        /* Wrapper */
        .email-wrapper {
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }
        
        /* Container */
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
        
        /* Logo Section */
        .logo-section {
            background-color: #2d4a3e;
            text-align: center;
            padding: 30px 20px;
        }
        
        .logo {
            max-width: 70px;
            height: auto;
        }
        
        /* Header Cancelado */
        .header-cancelled {
            background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        
        .icon-cancelled {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .header-cancelled h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }
        
        /* Content */
        .content {
            padding: 40px 30px;
        }
        
        .content p {
            color: #4a5568;
            font-size: 16px;
            margin-bottom: 20px;
        }
        
        .content strong {
            color: #2d3748;
            font-weight: 600;
        }
        
        /* Info Box */
        .info-box {
            background-color: #f7fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            border: 1px solid #e2e8f0;
        }
        
        .info-box h3 {
            color: #2d3748;
            font-size: 18px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .cancelled-info {
            border-left: 4px solid #e74c3c;
        }
        
        .reason-box {
            background-color: #fffbf5;
            border-left: 4px solid #f59e0b;
        }
        
        .reason-text {
            color: #78350f;
            font-style: italic;
            margin: 0;
            padding: 10px 15px;
            background-color: #fef3c7;
            border-radius: 8px;
        }
        
        /* Detail Row */
        .detail-row {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            padding: 12px;
            background-color: #ffffff;
            border-radius: 8px;
        }
        
        .detail-row:last-child {
            margin-bottom: 0;
        }
        
        .detail-icon {
            font-size: 20px;
            margin-right: 12px;
            min-width: 24px;
        }
        
        .detail-content {
            flex: 1;
        }
        
        .detail-content strong {
            display: block;
            color: #2d3748;
            margin-bottom: 2px;
            font-size: 14px;
        }
        
        /* CTA Section */
        .cta-section {
            text-align: center;
            margin: 35px 0;
            padding: 30px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 12px;
        }
        
        .cta-text {
            color: #166534;
            font-size: 16px;
            margin-bottom: 20px;
        }
        
        .btn-primary {
            display: inline-block;
            background: linear-gradient(135deg, #2d4a3e 0%, #3d5a4e 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(45, 74, 62, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(45, 74, 62, 0.4);
        }
        
        /* Contact Section */
        .contact-section {
            margin-top: 30px;
            text-align: center;
        }
        
        .contact-info {
            margin-top: 15px;
        }
        
        .contact-link {
            display: inline-flex;
            align-items: center;
            color: #2d4a3e;
            text-decoration: none;
            font-weight: 600;
            font-size: 18px;
            padding: 12px 24px;
            background-color: #f0fdf4;
            border-radius: 8px;
            transition: background-color 0.2s;
        }
        
        .contact-link:hover {
            background-color: #dcfce7;
        }
        
        .contact-icon {
            margin-right: 8px;
            font-size: 20px;
        }
        
        /* Footer */
        .footer {
            background-color: #1a202c;
            color: #a0aec0;
            text-align: center;
            padding: 30px 20px;
        }
        
        .footer p {
            margin: 8px 0;
            font-size: 14px;
        }
        
        .footer-small {
            font-size: 12px;
            color: #718096;
        }
        
        .footer a {
            color: #d4af7a;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 20px 10px;
            }
            
            .container {
                border-radius: 12px;
            }
            
            .header-cancelled h1 {
                font-size: 24px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .info-box {
                padding: 20px 15px;
            }
            
            .detail-row {
                flex-direction: column;
            }
            
            .detail-icon {
                margin-bottom: 8px;
            }
            
            .btn-primary {
                padding: 12px 24px;
                font-size: 14px;
            }
        }
    `;
}
