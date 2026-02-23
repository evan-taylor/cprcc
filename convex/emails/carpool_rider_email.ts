export interface RiderEmailProps {
  carColor: string;
  carType: string;
  driverEmail: string;
  driverName: string;
  driverPhoneNumber?: string;
  eventDate: string;
  eventLocation: string;
  eventTime: string;
  eventTitle: string;
  otherRiders: Array<{ name: string; phoneNumber?: string }>;
  riderName: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function generateRiderEmailHtml(props: RiderEmailProps): string {
  const {
    eventTitle,
    eventDate,
    eventTime,
    eventLocation,
    driverName,
    driverEmail,
    driverPhoneNumber,
    carColor,
    carType,
    otherRiders,
    riderName,
  } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .carpool-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626; }
    .rider-list { list-style: none; padding: 0; }
    .rider-list li { padding: 8px; background-color: #f3f4f6; margin: 5px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Cal Poly Red Cross Club</h1>
      <h2>Carpool Assignment - Rider</h2>
    </div>
    <div class="content">
      <p>Hi ${escapeHtml(riderName)},</p>
      <h3>Event: ${escapeHtml(eventTitle)}</h3>
      <p><strong>Date:</strong> ${escapeHtml(eventDate)}</p>
      <p><strong>Time:</strong> ${escapeHtml(eventTime)}</p>
      <p><strong>Location:</strong> ${escapeHtml(eventLocation)}</p>
      
      <div class="carpool-info">
        <h4>Your Carpool Assignment</h4>
        <p><strong>Role:</strong> Passenger</p>
        <p><strong>Driver:</strong> ${escapeHtml(driverName)}<br/><a href="mailto:${encodeURIComponent(driverEmail)}">${escapeHtml(driverEmail)}</a>${driverPhoneNumber ? `<br/><a href="tel:${encodeURIComponent(driverPhoneNumber)}">${escapeHtml(driverPhoneNumber)}</a>` : ""}</p>
        <p><strong>Vehicle:</strong> ${escapeHtml(carColor)} ${escapeHtml(carType)}</p>
        
        <h4>Other Passengers:</h4>
        ${
          otherRiders.length > 0
            ? `
        <ul class="rider-list">
          ${otherRiders.map((r) => `<li>${escapeHtml(r.name)}${r.phoneNumber ? `<br/><a href="tel:${encodeURIComponent(r.phoneNumber)}">${escapeHtml(r.phoneNumber)}</a>` : ""}</li>`).join("")}
        </ul>
        `
            : "<p>You are the only passenger in this carpool.</p>"
        }
      </div>
      
      <p>Please coordinate with your driver about pickup times and locations. Make sure to be ready on time!</p>
    </div>
    <div class="footer">
      <p>Cal Poly Red Cross Club</p>
      <p>Questions? Reply to this email or contact us at redcrossclub@calpoly.edu</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateRiderEmailSubject(eventTitle: string): string {
  return `Carpool Assignment: ${eventTitle} - Passenger`;
}
