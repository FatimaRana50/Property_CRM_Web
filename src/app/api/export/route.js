import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { requireAdmin } from '@/middleware/auth';
import * as XLSX from 'xlsx';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'excel';

  try {
    await dbConnect();

    const leads = await Lead.find({})
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .lean();

    const rows = leads.map((lead) => ({
      'Client Name': lead.name,
      Email: lead.email || '',
      Phone: lead.phone,
      'Property Interest': lead.propertyInterest,
      'Budget (PKR)': lead.budget,
      'Budget (Millions)': (lead.budget / 1000000).toFixed(1) + 'M',
      Status: lead.status,
      Priority: lead.priority,
      Score: lead.score,
      Source: lead.source,
      'Assigned To': lead.assignedTo?.name || 'Unassigned',
      Notes: lead.notes || '',
      'Follow Up Date': lead.followUpDate
        ? new Date(lead.followUpDate).toLocaleDateString()
        : '',
      'Created At': new Date(lead.createdAt).toLocaleDateString(),
    }));

    if (format === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);

      // Column widths
      ws['!cols'] = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 18 },
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
        { wch: 8 }, { wch: 12 }, { wch: 18 }, { wch: 30 },
        { wch: 15 }, { wch: 15 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Leads');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    }

    // CSV fallback
    const csvHeaders = Object.keys(rows[0] || {}).join(',');
    const csvRows = rows.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [csvHeaders, ...csvRows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
