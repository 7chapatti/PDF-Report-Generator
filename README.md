This is a PDF report generator for a little shop.
It seeds an SQLite orders table, aggregates it into a sales summary with SQL, renders that summary as a real PDF using headless Chromium, and serves the finished file by link — with a once-per-day idempotency guard so a double-click doesn't produce two reports.

## How to run
Install dependencies:

```bash
npm install
npx playwright install chromium
```

Seed the database:

```bash
npm run seed
```

Start the API:

```bash
npm start
```

API runs on `http://localhost:3000`.

Generate report:

```bash
curl.exe -i -X POST http://localhost:3000/reports
```

API returns a report ID and file link, for example:

```json
{
  "id": 1,
  "file": "/reports/1/file"
}
```

Download the generated PDF:

```bash
curl.exe -o my-report.pdf http://localhost:3000/reports/1/file
```

Replace `1` with the ID returned by the POST request.

Get report information:

```bash
curl.exe -i http://localhost:3000/reports/1
```
Replace `1` with the ID returned by the POST request.

Test non existent report:
```
curl.exe -i http://localhost:3000/reports/99999
```
This should return 404 Not Found.

## Aggregation SQL
```sql
-- totals
SELECT COUNT(*) as total_orders, SUM(amount) as total_revenue FROM orders;

-- top 5 products by revenue
SELECT product, SUM(amount) as revenue
FROM orders GROUP BY product ORDER BY revenue DESC LIMIT 5;

-- orders per day, last 7 days
SELECT date(created_at) as day, COUNT(*) as count
FROM orders
WHERE date(created_at) >= date('now', '-7 days')
GROUP BY day ORDER BY day;
```

Output, seeded with 200 rows:
```json
{
  "total_orders": 200,
  "total_revenue": 20204.96,
  "top_products": [
    {"product": "Contraption", "revenue": 4088.36},
    {"product": "Widget", "revenue": 3793.77},
    {"product": "Gizmo", "revenue": 3304.93}
  ]
}
```
##Tests passed proof below: 
<img width="740" height="226" alt="image" src="https://github.com/user-attachments/assets/d162e242-1702-4564-81f0-3598c99181cc" />
.

##Seed test proof:
<img width="317" height="42" alt="image" src="https://github.com/user-attachments/assets/229c6523-2ba4-4ccf-94da-41608a313dc8" />
.
Seeds stay at 200 after running twice, doesn't go to 400. 

##SQL output test:
<img width="517" height="192" alt="image" src="https://github.com/user-attachments/assets/b39c2b37-96ff-47e6-a231-1388d5a21cfb" />
.

##Stage 0 checkpoint proof:
<img width="525" height="201" alt="image" src="https://github.com/user-attachments/assets/b425dc18-fbd1-4c51-a528-466dba1b9877" />
.

##/reports endpoint test proof:
<img width="537" height="197" alt="image" src="https://github.com/user-attachments/assets/80b4555b-26b2-455e-8e81-54e150757846" />
.

##PDF exists proof:
<img width="1076" height="670" alt="image" src="https://github.com/user-attachments/assets/4ade3240-ea47-48b2-95e8-9e7d195ba929" />
.

##PDF contains seeded data, extends over at least 2 pages, headings on both pages, no row cut in half proof:
<img width="1062" height="670" alt="image" src="https://github.com/user-attachments/assets/a52487e8-1693-4807-b24e-56ac4559f2e0" />
.
curl -o my-report.pdf http://localhost:3000/reports/1/file. Opens the same PDF too.

##Non existent ID proof:
<img width="582" height="197" alt="image" src="https://github.com/user-attachments/assets/03f601be-923b-4704-98d5-ea59fe7afa9a" />
.

##Orders per day proof:
<img width="307" height="196" alt="image" src="https://github.com/user-attachments/assets/01f9b718-370b-4a34-9645-d0940e57db0c" />
.

##Individual orders information proof:
<img width="687" height="275" alt="image" src="https://github.com/user-attachments/assets/41ec0fe5-31c7-48ce-9a95-06a7418bc1ff" />
.

##Idempotency test proof:
<img width="880" height="96" alt="image" src="https://github.com/user-attachments/assets/55c60b21-394e-4b35-b121-6889b5a6397b" />
.

##Get report information test proof:
<img width="646" height="220" alt="image" src="https://github.com/user-attachments/assets/4af288f1-6022-41a9-a44a-e2fe8f2f56c7" />


##stage 4: When to move out of the request:
I would move the report generation out of the request and into a background job when report generation becomes noticeably slower or when multiple users are generating reports at the same time.

##stage 5: Idempotency:
Idempotency check stops duplicate requests, such as double-clicking the generate report button, which would make multiple identical reports and files. 
In a real-world system, a missing check could cause a customer to receive the same email or be charged for the same transaction multiple times.





