import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");
    const bookingId = searchParams.get("bookingId");

    if (!paymentId && !bookingId) {
      return NextResponse.json({ error: "paymentId or bookingId is required" }, { status: 400 });
    }

    // Get payment with booking details
    let query = supabaseAdmin
      .from("payments")
      .select("*, bookings(*, customers(first_name, last_name, email, phone, address_line1, address_line2, city, state, zip_code))");

    if (paymentId) {
      query = query.eq("id", paymentId);
    } else if (bookingId) {
      query = query.eq("booking_id", bookingId);
    }

    const { data: payment, error } = await query.single();

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const booking = payment.bookings as Record<string, unknown>;
    const customer = (booking?.customers || {}) as Record<string, unknown>;

    // Generate HTML invoice
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #0d9488; }
    .logo { font-size: 24px; font-weight: 700; color: #0d9488; }
    .logo-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 28px; color: #1e293b; }
    .invoice-title p { font-size: 13px; color: #64748b; margin-top: 4px; }
    .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .details-col { flex: 1; }
    .details-col h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 8px; }
    .details-col p { font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .amount { text-align: right; }
    .total-row td { border-top: 2px solid #0d9488; font-weight: 700; font-size: 15px; padding-top: 16px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Hygiene Maids</div>
      <div class="logo-sub">Professional Cleaning Services<br>(469) 935-7031 &middot; info@hygienemaids.com</div>
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <p>Invoice #INV-${String(booking.booking_number).padStart(6, '0')}<br>
      Date: ${new Date(payment.created_at as string).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>
  </div>

  <div class="details">
    <div class="details-col">
      <h3>Bill To</h3>
      <p>
        <strong>${customer.first_name} ${customer.last_name}</strong><br>
        ${customer.email}<br>
        ${customer.phone ? `${customer.phone}<br>` : ''}
        ${customer.address_line1 || booking.address_line1}${customer.address_line2 ? `, ${customer.address_line2}` : ''}<br>
        ${customer.city || booking.city}, ${customer.state || booking.state || 'TX'} ${customer.zip_code || booking.zip_code}
      </p>
    </div>
    <div class="details-col">
      <h3>Service Details</h3>
      <p>
        <strong>Booking #${booking.booking_number}</strong><br>
        Date: ${new Date((booking.scheduled_date as string) + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}<br>
        Time: ${booking.scheduled_time ? new Date('2000-01-01T' + booking.scheduled_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBD'}<br>
        Frequency: ${booking.frequency}<br>
        Status: ${(payment.status as string).toUpperCase()}
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Details</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Professional Cleaning Service</td>
        <td>${booking.bedrooms}bd / ${booking.bathrooms}ba &middot; ${booking.sqft_range} sqft</td>
        <td class="amount">$${(booking.base_price as number)?.toFixed(2) || '0.00'}</td>
      </tr>
      ${booking.discount_amount && (booking.discount_amount as number) > 0 ? `
      <tr>
        <td>Frequency Discount (${booking.frequency})</td>
        <td>&nbsp;</td>
        <td class="amount" style="color: #059669;">-$${(booking.discount_amount as number).toFixed(2)}</td>
      </tr>` : ''}
      ${booking.extras_amount && (booking.extras_amount as number) > 0 ? `
      <tr>
        <td>Add-on Services</td>
        <td>&nbsp;</td>
        <td class="amount">$${(booking.extras_amount as number).toFixed(2)}</td>
      </tr>` : ''}
      ${booking.tax_amount && (booking.tax_amount as number) > 0 ? `
      <tr>
        <td>Tax</td>
        <td>&nbsp;</td>
        <td class="amount">$${(booking.tax_amount as number).toFixed(2)}</td>
      </tr>` : ''}
      <tr class="total-row">
        <td>Total</td>
        <td>&nbsp;</td>
        <td class="amount">$${(payment.amount as number)?.toFixed(2) || (booking.total as number)?.toFixed(2) || '0.00'}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>Thank you for choosing Hygiene Maids!</p>
    <p style="margin-top: 4px;">Questions? Contact us at (469) 935-7031 or info@hygienemaids.com</p>
  </div>
</body>
</html>`;

    return new NextResponse(invoiceHtml, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="invoice-${booking.booking_number}.html"`,
      },
    });
  } catch (err) {
    console.error("Invoice API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
