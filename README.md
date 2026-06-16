# Taxi4U Premium Booking Page

A modern, premium taxi booking interface built with Next.js and Tailwind CSS, designed to replace the existing outdated booking system with a professional, English-language experience.

## Features

- **Premium Dark Design** - Elegant gradient background with subtle animated orbs
- **Complete Booking Form** with fields for:
  - Pickup and dropoff locations
  - Date and time selection
  - Passenger count
  - Vehicle type (Sedan, 6-seater, 8-seater, Wheelchair accessible)
  - Passenger name and phone number
  - Additional special requests
- **High-End UI Patterns**:
  - Double-Bezel card architecture for depth
  - Asymmetrical Bento grid layout
  - Smooth entry animations with cubic-bezier easing
  - Responsive design (mobile-first, falls back to single column)
  - GPU-optimized animations (transform & opacity only)
- **Ready for Taxi4U API Integration** - Backend hooks for booking submission

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Taxi4U API credentials
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── page.tsx          # Main page with animated background
│   ├── layout.tsx        # Root layout with metadata
│   └── globals.css       # Global styles and animations
├── components/
│   └── BookingForm.tsx   # Main booking form component
├── lib/
│   └── taxi4u-api.ts     # Taxi4U API integration (in progress)
└── package.json
```

## API Integration

The booking form is ready to integrate with the Taxi4U API. See `lib/taxi4u-api.ts` for the placeholder functions that need to be implemented:

- `createBooking()` - Submit booking request
- `validateLocation()` - Validate/autocomplete addresses
- `getAvailableVehicles()` - Check vehicle availability and pricing

## Environment Variables

Required (in `.env.local`):
- `TAXI4U_USERNAME` - Your Taxi4U API username
- `TAXI4U_PASSWORD` - Your Taxi4U API password
- `NEXT_PUBLIC_API_URL` - Taxi4U API base URL

## Building for Production

```bash
npm run build
npm start
```

## Technologies Used

- [Next.js 16](https://nextjs.org) - React framework
- [Tailwind CSS 4](https://tailwindcss.com) - Utility-first CSS
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Lucide React](https://lucide.dev) - Icon library

## License

Private - Taxi4U Booking System
