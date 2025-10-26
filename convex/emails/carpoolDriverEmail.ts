interface DriverEmailProps {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  driverName: string;
  carColor: string;
  carType: string;
  capacity: number;
  riders: Array<{ name: string; email: string; phoneNumber?: string }>;
}

export function generateDriverEmailHtml(props: DriverEmailProps): string {
  const {
    eventTitle,
    eventDate,
    eventTime,
    eventLocation,
    carColor,
    carType,
    capacity,
    riders,
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
      <h2>Carpool Assignment - Driver</h2>
    </div>
    <div class="content">
      <h3>Event: ${eventTitle}</h3>
      <p><strong>Date:</strong> ${eventDate}</p>
      <p><strong>Time:</strong> ${eventTime}</p>
      <p><strong>Location:</strong> ${eventLocation}</p>
      
      <div class="carpool-info">
        <h4>Your Carpool Assignment</h4>
        <p><strong>Role:</strong> Driver</p>
        <p><strong>Your Vehicle:</strong> ${carColor} ${carType}</p>
        <p><strong>Capacity:</strong> ${capacity} passengers</p>
        
        <h4>Your Passengers:</h4>
        ${
          riders.length > 0
            ? `
        <ul class="rider-list">
          ${riders.map((rider) => `<li>${rider.name}<br/><a href="mailto:${rider.email}">${rider.email}</a>${rider.phoneNumber ? `<br/><a href="tel:${rider.phoneNumber}">${rider.phoneNumber}</a>` : ""}</li>`).join("")}
        </ul>
        `
            : "<p>No passengers assigned to your vehicle.</p>"
        }
      </div>
      
      <p>Please coordinate with your passengers about pickup times and locations. If you have any questions or need to make changes, please contact the board.</p>
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

export function generateDriverEmailSubject(eventTitle: string): string {
  return `Carpool Assignment: ${eventTitle} - Driver`;
}
