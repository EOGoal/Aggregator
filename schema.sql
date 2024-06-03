CREATE TABLE company (
    id INTEGER PRIMARY KEY,
    name TEXT,
	participant TEXT,
	UNIQUE(name)
);

CREATE TABLE report (
	id INTEGER PRIMARY KEY,
	company_id INTEGER,
	received_at INTEGER,
	FOREIGN KEY(company_id) REFERENCES company(id)
);

CREATE TABLE twelve_months (
    id INTEGER PRIMARY KEY,
    report_id INTEGER,
    m1_label TEXT,
    m1_value TEXT,
    m2_label TEXT,
    m2_value TEXT,
    m3_label TEXT,
    m3_value TEXT,
    m4_label TEXT,
    m4_value TEXT,
    m5_label TEXT,
    m5_value TEXT,
    m6_label TEXT,
    m6_value TEXT,
    m7_label TEXT,
    m7_value TEXT,
    m8_label TEXT,
    m8_value TEXT,
    m9_label TEXT,
    m9_value TEXT,
    m10_label TEXT,
    m10_value TEXT,
    m11_label TEXT,
    m11_value TEXT,
    m12_label TEXT,
    m12_value TEXT,
    FOREIGN KEY (report_id) REFERENCES report(id)
);

CREATE TABLE rolling_twelve (
    id INTEGER PRIMARY KEY,
    report_id INTEGER,
    start_date DATE,
    end_date DATE,
    amount TEXT,
    FOREIGN KEY (report_id) REFERENCES report(id)
);
