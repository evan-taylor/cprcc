interface RiderEmailProps {
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
      <h3>Event: ${eventTitle}</h3>
      <p><strong>Date:</strong> ${eventDate}</p>
      <p><strong>Time:</strong> ${eventTime}</p>
      <p><strong>Location:</strong> ${eventLocation}</p>
      
      <div class="carpool-info">
        <h4>Your Carpool Assignment</h4>
        <p><strong>Role:</strong> Passenger</p>
        <p><strong>Driver:</strong> ${driverName}<br/><a href="mailto:${driverEmail}">${driverEmail}</a>${driverPhoneNumber ? `<br/><a href="tel:${driverPhoneNumber}">${driverPhoneNumber}</a>` : ""}</p>
        <p><strong>Vehicle:</strong> ${carColor} ${carType}</p>
        
        <h4>Other Passengers:</h4>
        ${
          otherRiders.length > 0
            ? `
        <ul class="rider-list">
          ${otherRiders.map((r) => `<li>${r.name}${r.phoneNumber ? `<br/><a href="tel:${r.phoneNumber}">${r.phoneNumber}</a>` : ""}</li>`).join("")}
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
