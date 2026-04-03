import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/database';
import { verifySession, COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      last_name, first_name, email, organization, legal_form, country,
      photo,
      donotphone, donotbulkemail, target_owner, evaluation,
      description, mobile_phone, job_title, interested_by, products_solutions,
    } = body;

    if (!last_name || !first_name || !email || !organization || !legal_form || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDatabase();
    const result = await db.execute({
      sql: `INSERT INTO leads
        (last_name, first_name, email, organization, legal_form, country, photo,
         donotphone, donotbulkemail, target_owner, evaluation, description,
         mobile_phone, job_title, interested_by, products_solutions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        last_name, first_name, email, organization, legal_form, country,
        photo ?? null,
        donotphone ? 1 : 0, donotbulkemail ? 1 : 0,
        target_owner ?? null, evaluation ?? null, description ?? null,
        mobile_phone ?? null, job_title ?? null, interested_by ?? null, products_solutions ?? null,
      ],
    });

    // Push data to Google Sheets via Apps Script Webhook
    try {
      const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbzl-POic3w9qd-K2At7rQQvejqDZAx6vPOUe4bfvl7-6SyeUDC5XoSHx2bT6CgOppN5/exec';
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${first_name} ${last_name}`.trim(),
          email: email,
          company: organization,
          message: description || '',
          ...body
        }),
      });
    } catch (webhookError) {
      console.error('[Leads Webhook] Error pushing to Google Sheets:', webhookError);
    }

    return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? '';
  if (!verifySession(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = getDatabase();
    const result = await db.execute(
      `SELECT id, last_name, first_name, email, organization, legal_form, country,
       job_title, evaluation, mobile_phone, interested_by, products_solutions,
       description, donotphone, donotbulkemail, created_at
       FROM leads ORDER BY created_at DESC`
    );
    return NextResponse.json({ leads: result.rows });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
