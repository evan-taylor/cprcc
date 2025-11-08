# Cal Poly Red Cross Club Website

The official website for the Cal Poly San Luis Obispo Red Cross Club, serving as the primary digital hub for students interested in volunteering with the American Red Cross chapter on campus.

## About

This website provides information about the Cal Poly Red Cross Club, including:

- **Mission and Organization**: Learn about the American Red Cross mission and the Cal Poly chapter
- **Volunteer Opportunities**: Information about blood drives, disaster relief, health and safety training
- **Getting Started**: Step-by-step guides for becoming an approved Red Cross volunteer
- **Deployment Information**: Details about GAP training and disaster response opportunities
- **Contact**: Multiple ways to connect with the club (email, GroupMe, Instagram)

## Technology Stack

- **Frontend**: Next.js 15 with App Router, React 19, Tailwind CSS 4
- **Backend**: Convex (backend-as-a-service)
- **Authentication**: Convex Auth with password strategy
- **Package Manager**: pnpm
- **Code Quality**: Biome, ESLint, Ultracite presets

## Getting Started

### Prerequisites

- Node.js 20 or later
- pnpm package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   OPENAI_API_KEY=your_openai_key (optional, for chat demo)
   ```

4. Set up Convex authentication:
   ```bash
   npx convex dev
   ```
   Follow the setup prompts to configure your Convex backend.

5. Run the development server:
   ```bash
   pnpm dev
   ```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home page (mission, who we are)
│   ├── contact/                  # Contact information
│   ├── events/                   # Events and volunteer opportunities
│   ├── deployment/               # Deployment and GAP training info
│   ├── volunteer-connection/     # Red Cross signup guide
│   ├── signin/                   # Authentication page
│   └── admin/                    # Admin dashboard
├── components/                   # Shared React components
│   ├── site-header.tsx           # Main navigation
│   └── convex-client-provider.tsx
├── convex/                       # Convex backend functions
│   ├── schema.ts                 # Database schema
│   └── index.ts                  # API functions
└── biome.jsonc                   # Code formatting config
```

## Development

### Code Quality

This project uses strict code quality standards:

- **Linting**: Run `npx ultracite check` to check code quality
- **Formatting**: Biome auto-formats on save (if configured in your editor)
- **Standards**: See `AGENTS.md` and `.rules` for detailed coding guidelines

### Available Scripts

- `pnpm dev` - Start development server (runs both Next.js and Convex)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Features

### Current Features

- Informational pages about the Red Cross Club and volunteer opportunities
- Step-by-step volunteer onboarding guides
- Contact information and social media links
- Authentication system for future member features
- Responsive design with Tailwind CSS

### Planned Features

- Internal event management system
- Member RSVP functionality
- Volunteer hour tracking
- Officer dashboard for event creation and analytics

## Contributing

This is a student organization project. If you're a Cal Poly student interested in contributing, please reach out to the club officers.

## Contact

- **Email**: redcrossclub@calpoly.edu
- **Instagram**: [@calpolyredcross](https://www.instagram.com/calpolyredcross/)
- **GroupMe**: Join via the contact page

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [American Red Cross](https://www.redcross.org/)
