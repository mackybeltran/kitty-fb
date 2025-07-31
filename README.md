# Kitty FB

A Firebase Cloud Functions API for managing shared inventory in group spaces. Users can purchase buckets of units (any consumable items), track consumption through an honor system, and manage group finances.

## 🚀 Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd kitty-fb/functions
   npm install
   ```

2. **Deploy to Firebase:**
   ```bash
   npm run deploy
   ```

3. **Test the API:**
   ```bash
   curl -X GET https://your-function-url/dev/stats
   ```

## ✨ Features

- **User & Group Management** - Create users and groups with admin permissions
- **Bucket System** - Purchase and track consumable units with automatic switching
- **Consumption Tracking** - Honor system for recording unit consumption
- **Balance Management** - Admin-controlled debt tracking for users
- **Join Request System** - Secure group membership with admin approval
- **Kitty Transactions** - Track group finances and contributions
- **RESTful API** - Complete Firebase Cloud Functions backend

## 📚 Documentation

- **[API Reference](docs/API.md)** - Complete API endpoints and examples
- **[Setup Guide](docs/SETUP.md)** - Firebase setup and deployment instructions
- **[Development Guide](docs/DEVELOPMENT.md)** - Local development and testing
- **[Architecture](docs/ARCHITECTURE.md)** - System design and data models
- **[Frontend Guide](docs/FRONTEND_GUIDE.md)** - Frontend integration guide

## 🏗 Architecture

- **Backend**: Firebase Cloud Functions (Node.js/TypeScript)
- **Database**: Firestore (NoSQL)
- **API**: RESTful with Joi validation
- **Architecture**: Controller-Service pattern with layered design

## 🔧 Development

```bash
# Start local development
cd functions
npm run serve

# Run tests
npm test

# Deploy to production
npm run deploy
```

## 📊 Project Structure

```
kitty-fb/
├── functions/           # Firebase Cloud Functions
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Validation & error handling
│   │   └── utils/       # Shared utilities
│   └── package.json
├── docs/               # Documentation
├── firebase.json       # Firebase configuration
└── README.md          # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Need help?** Check the [documentation](docs/) or create an issue. 