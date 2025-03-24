import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface BaseEmailData {
  name: string;
  role: string;
  email: string;
  comments?: string;
}

interface RoomChecksEmailData extends BaseEmailData {
  type: "room-checks";
  region: string;
  purpose: string;
  neededBy: string;
}

interface ToolRequestEmailData extends BaseEmailData {
  type: "tool-request";
  toolName: string;
  description: string;
  useCase: string;
  priority: string;
}

type EmailData = RoomChecksEmailData | ToolRequestEmailData;

export async function POST(request: Request) {
  try {
    const data: EmailData = await request.json();

    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    let mailOptions;

    if (data.type === "room-checks") {
      // Format the date
      const formattedDate = new Date(data.neededBy).toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      mailOptions = {
        from: process.env.SMTP_USER,
        to: "btalesnik@bbyo.org",
        subject: `Room Checks Request - ${data.region} - ${data.purpose}`,
        html: `
          <h2>New Room Checks Request</h2>
          <p><strong>From:</strong> ${data.name} (${data.role})</p>
          <p><strong>Region:</strong> ${data.region}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Purpose:</strong> ${data.purpose}</p>
          <p><strong>Needed By:</strong> ${formattedDate}</p>
          ${
            data.comments
              ? `<p><strong>Additional Comments:</strong><br>${data.comments}</p>`
              : ""
          }
        `,
      };
    } else {
      mailOptions = {
        from: process.env.SMTP_USER,
        to: "btalesnik@bbyo.org",
        subject: `New Tool Request - ${data.toolName}`,
        html: `
          <h2>New Tool Request</h2>
          <p><strong>From:</strong> ${data.name} (${data.role})</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Tool Name:</strong> ${data.toolName}</p>
          <p><strong>Priority:</strong> ${data.priority}</p>
          <p><strong>Description:</strong><br>${data.description}</p>
          <p><strong>Use Case:</strong><br>${data.useCase}</p>
          ${
            data.comments
              ? `<p><strong>Additional Comments:</strong><br>${data.comments}</p>`
              : ""
          }
        `,
      };
    }

    // Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
