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
    SUM(CAST(rt.amount AS DECIMAL)) AS rolling_twelve
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
    c.participant;