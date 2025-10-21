# FAN London Inventory Manager

A Next.js-based inventory management system with MongoDB backend.

## Features

- Product catalog with types, base content, and purchase pack tracking
- Transaction logging (input/output)
- Current stock calculation
- Archive functionality
- Responsive design (iPad-optimized)

## Tech Stack

- **Frontend & Backend**: Next.js 15 (App Router)
- **Database**: MongoDB (MongoDB Atlas)
- **Styling**: Custom CSS
- **Deployment**: Vercel

## Environment Variables

Create a `.env.local` file in the root directory:

```
MONGODB_URI=your_mongodb_connection_string
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

The project is configured for easy Vercel deployment:

```bash
vercel
```

Make sure to set the `MONGODB_URI` environment variable in your Vercel project settings.

## Project Structure

```
/src
  /app             # Next.js pages and API routes
  /components      # React components
  /lib             # Utilities (API helpers, DB connection, models)
  /assets          # Static assets (logos, icons)
/data              # CSV seed data
/public            # Public static files
```

## License

Private project for FAN London.
