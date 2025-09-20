# ⚾ Chalk Line

**"We don't walk within the chalk"**

A privacy-compliant, offline-first baseball scorekeeping app built with modern web technologies.

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Authentication**: Clerk
- **Database**: Convex (real-time, offline-first)
- **Styling**: TailwindCSS + Shadcn/ui
- **Testing**: Vitest + Testing Library
- **Development**: GitHub SpecKit workflow

## 🔐 Privacy-First Design

Built with COPPA compliance in mind:
- ✅ First name + last name initial only
- ✅ No full personal information stored
- ✅ Secure user authentication

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MCSDWes/chalk-line.git
   cd chalk-line
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your Clerk and Convex keys
   ```

4. **Start development**
   ```bash
   npm run dev          # Start Vite dev server
   npm run convex:dev   # Start Convex development
   ```

## 🧪 Testing

```bash
npm run test        # Run tests in watch mode
npm run test:run    # Run tests once
```

## 📁 Project Structure

```
chalk-line/
├── src/                    # React application source
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and auth
│   ├── test/              # Test files
│   └── types/             # TypeScript type definitions
├── convex/                # Backend functions and schema
├── specs/                 # SpecKit feature specifications
├── docs/                  # Project documentation
└── [config files]        # Various configuration files
```

## 🎯 Features

- [x] User authentication (Clerk)
- [x] Privacy-compliant data model
- [x] Team management
- [ ] Player roster management
- [ ] Game scorekeeping
- [ ] Offline functionality
- [ ] Score sharing

## 🔧 Development Workflow

This project uses GitHub SpecKit for specification-driven development:

1. **Specify**: Write feature specifications
2. **Plan**: Break down into actionable tasks
3. **Test**: Write tests first (TDD)
4. **Implement**: Build features to pass tests
5. **Deploy**: Continuous deployment

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the SpecKit workflow
4. Submit a pull request

---

Built with ❤️ for youth baseball teams