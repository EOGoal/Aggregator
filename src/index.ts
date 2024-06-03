interface Env {
  GOOGLE_CLOUD_CREDENTIALS: string;
  SPREADSHEET_ID: string;
  DB: D1Database;
  QUEUE: Queue;
}

import {getAccessToken} from 'web-auth-library/google';

export default {
  async fetch(request, env): Promise<Response> {
    const {pathname} = new URL(request.url);

    if (pathname === '/report' && request.method === 'POST') {
      const data = (await request.json()) as any;

      // Insert the company name
      const {results: res1} = await env.DB.prepare(
        `INSERT INTO company(name,participant) VALUES(?, ?) ON CONFLICT(name) DO UPDATE SET participant=excluded.participant RETURNING id;`
      )
        .bind(data.companyName, data.participantName)
        .all();

      const companyId = res1[0].id;

      // Now insert the data
      const {results: res2} = await env.DB.prepare(
        `INSERT INTO report(company_id, received_at) VALUES(?, ?) RETURNING id;`
      )
        .bind(companyId, Math.floor(Date.now() / 1000))
        .all();

      const reportId = res2[0].id;

      // Insert the monthly data
      await env.DB.prepare(
        `INSERT INTO twelve_months(report_id, m1_label, m1_value, m2_label, m2_value, m3_label, m3_value, m4_label, m4_value, m5_label, m5_value, m6_label, m6_value, m7_label, m7_value, m8_label, m8_value, m9_label, m9_value, m10_label, m10_value, m11_label, m11_value, m12_label, m12_value)
         VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
      )
        .bind(
          reportId,
          data.twelveMonths[0].month,
          data.twelveMonths[0].amount,
          data.twelveMonths[1].month,
          data.twelveMonths[1].amount,
          data.twelveMonths[2].month,
          data.twelveMonths[2].amount,
          data.twelveMonths[3].month,
          data.twelveMonths[3].amount,
          data.twelveMonths[4].month,
          data.twelveMonths[4].amount,
          data.twelveMonths[5].month,
          data.twelveMonths[5].amount,
          data.twelveMonths[6].month,
          data.twelveMonths[6].amount,
          data.twelveMonths[7].month,
          data.twelveMonths[7].amount,
          data.twelveMonths[8].month,
          data.twelveMonths[8].amount,
          data.twelveMonths[9].month,
          data.twelveMonths[9].amount,
          data.twelveMonths[10].month,
          data.twelveMonths[10].amount,
          data.twelveMonths[11].month,
          data.twelveMonths[11].amount
        )
        .run();

      // Insert the rolling_twelve data
      await env.DB.prepare(
        `INSERT INTO rolling_twelve(report_id, start_date, end_date, amount)
         VALUES(?, ?, ?, ?);`
      )
        .bind(reportId, data.rollingTwelve.start, data.rollingTwelve.end, data.rollingTwelve.amount)
        .run();

      await env.QUEUE.send(reportId);

      return Response.json({});
    }

    return new Response('Not found', {status: 404});
  },

  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext) {
    const data = await env.DB.prepare(
      /* sql */ `
SELECT
  c.participant,
  m.m1_label,
  SUM(CAST(m.m1_value AS DECIMAL)) AS m1,
  m.m2_label,
  SUM(CAST(m.m2_value AS DECIMAL)) AS m2,
  m.m3_label,
  SUM(CAST(m.m3_value AS DECIMAL)) AS m3,
  m.m4_label,
  SUM(CAST(m.m4_value AS DECIMAL)) AS m4,
  m.m5_label,
  SUM(CAST(m.m5_value AS DECIMAL)) AS m5,
  m.m6_label,
  SUM(CAST(m.m6_value AS DECIMAL)) AS m6,
  m.m7_label,
  SUM(CAST(m.m7_value AS DECIMAL)) AS m7,
  m.m8_label,
  SUM(CAST(m.m8_value AS DECIMAL)) AS m8,
  m.m9_label,
  SUM(CAST(m.m9_value AS DECIMAL)) AS m9,
  m.m10_label,
  SUM(CAST(m.m10_value AS DECIMAL)) AS m10,
  m.m11_label,
  SUM(CAST(m.m11_value AS DECIMAL)) AS m11,
  m.m12_label,
  SUM(CAST(m.m12_value AS DECIMAL)) AS m12,
  SUM(CAST(rt.amount AS DECIMAL)) AS rolling_twelve,
  rt.end_date
FROM
  company c
  INNER JOIN report r ON c.id = r.company_id
  INNER JOIN twelve_months m ON r.id = m.report_id
  INNER JOIN rolling_twelve rt ON r.id = rt.report_id
WHERE
  r.id = (
      SELECT id
      FROM report
      WHERE company_id = c.id
      ORDER BY received_at DESC
      LIMIT 1
  )
GROUP BY
  c.participant
ORDER BY
  rolling_twelve DESC;`.replace(/\n/g, ' ')
    ).all();

    const updateData = data.results.map(row => [
      row.participant,
      row.rolling_twelve,
      row.m1,
      row.m2,
      row.m3,
      row.m4,
      row.m5,
      row.m6,
      row.m7,
      row.m8,
      row.m9,
      row.m10,
      row.m11,
      row.m12,
      row.end_date,
    ]);

    const accessToken = await getAccessToken({
      credentials: env.GOOGLE_CLOUD_CREDENTIALS,
      // waitUntil: ctx.waitUntil, // https://github.com/kriasoft/web-auth-library/issues/28
      scope: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const spreadsheetUpdateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {authorization: `Bearer ${accessToken}`},
        body: JSON.stringify({
          data: [
            {
              majorDimension: 'ROWS',
              range: 'Raw Data!A2:O',
              values: updateData,
            },
          ],
          valueInputOption: 'USER_ENTERED',
        }),
      }
    );

    await spreadsheetUpdateRes.json();
  },
} satisfies ExportedHandler<Env>;
