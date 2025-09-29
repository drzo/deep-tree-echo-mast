# Deep Tree Echo Mast 🌳🤖

An advanced AI system built on the Mastra framework, featuring sophisticated cognitive capabilities, memory processing, and multi-agent orchestration. This project integrates cognitive skills from ai-opencog with modern AI infrastructure to create a powerful, self-evolving AI ecosystem.

## 🚀 Features

### Core AI Capabilities
- **🧠 Cognitive Skills**: Advanced reasoning, code analysis, production optimization, and adaptive learning
- **💭 Memory System**: Semantic, episodic, and wisdom memory repositories with automated processing
- **🤖 Deep Tree Echo Agent**: Conversational AI with memory-enhanced responses
- **⚡ Workflow Orchestration**: Automated daily, weekly, and monthly memory processing

### Technical Infrastructure  
- **🏗️ Mastra Framework**: Modern TypeScript-based agent framework
- **📊 PostgreSQL + pgvector**: Vector-enabled database for memory storage
- **⏰ Inngest Integration**: Workflow scheduling and observability
- **🌐 Web Interface**: Remix-based EchoSelf app with AI chat and visualization
- **🔗 Multi-platform**: Slack and Telegram integrations

## 🏗️ Architecture

```
deep-tree-echo-mast/
├── src/
│   ├── mastra/                 # Mastra framework configuration
│   │   ├── agents/            # AI agents (Deep Tree Echo Agent)
│   │   ├── tools/             # Memory and conversation tools
│   │   ├── workflows/         # Automated memory processing
│   │   └── index.ts           # Main Mastra configuration
│   ├── skills/                # Cognitive capabilities
│   │   ├── cognitive/         # Code analysis and reasoning
│   │   ├── learning/          # Adaptive learning systems
│   │   ├── nanocog/          # Meta-cognitive orchestration
│   │   └── optimization/      # Production optimization
│   └── triggers/              # External integrations (Slack, Telegram)
├── echoself/                  # Remix web application
└── scripts/                   # Build and deployment scripts
```

## 🛠️ Installation

### Prerequisites
- Node.js >= 20.9.0
- PostgreSQL with pgvector extension
- OpenAI API key (or compatible provider)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/drzo/deep-tree-echo-mast.git
   cd deep-tree-echo-mast
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Ensure PostgreSQL with pgvector is running
   # Database will be automatically initialized
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📝 Configuration

### Environment Variables

```bash
# AI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional

# Database
DATABASE_URL=postgresql://localhost:5432/mastra

# Scheduling (optional)
SCHEDULE_CRON_TIMEZONE=America/Los_Angeles
SCHEDULE_CRON_EXPRESSION=0 2 * * *

# External Integrations (optional)
SLACK_BOT_TOKEN=your_slack_token
TELEGRAM_BOT_TOKEN=your_telegram_token
```

## 🎯 Usage

### Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run check

# Code formatting
npm run format
npm run check:format

# Testing
npm run test
npm run test:watch
npm run test:coverage

# Build for production
npm run build
```

### Running with Inngest (for workflows)

```bash
# Terminal 1: Start Mastra dev server
npm run dev

# Terminal 2: Start Inngest dev server (for workflows)
npx inngest-cli@latest dev
```

### API Endpoints

- **Chat API**: `POST /api/chat` - Interact with Deep Tree Echo Agent
- **Inngest**: `/api/inngest` - Workflow management and scheduling

### Example Chat API Usage

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Hello, can you help me analyze some code?",
    sessionId: "optional-session-id"
  })
});

const data = await response.json();
console.log(data.response);
```

## 🧠 Cognitive Skills

The system includes advanced cognitive capabilities:

### Code Analysis Skill
- Intelligent code quality analysis
- Pattern recognition and anti-pattern detection
- Maintainability scoring and suggestions

### Advanced Reasoning Skill
- Multi-step logical reasoning
- Problem decomposition and synthesis
- Contextual decision making

### Production Optimization Skill
- Performance monitoring and optimization
- Resource usage analysis
- System health diagnostics

### Adaptive Learning Skill
- Self-improving algorithms
- Pattern learning from interactions
- Behavioral adaptation over time

## 💭 Memory System

The Deep Tree Echo Agent maintains sophisticated memory:

- **Semantic Memory**: Factual knowledge and concepts
- **Episodic Memory**: Conversation history and experiences  
- **Wisdom Memory**: Learned insights and patterns
- **Working Memory**: Active context and recent interactions

Memory processing runs automatically:
- **Daily**: Parse and categorize new interactions
- **Weekly**: Process and consolidate memories
- **Monthly**: Generate insights and wisdom

## 🌐 Web Interface

The EchoSelf web application provides:
- Interactive chat with the AI agent
- Memory visualization and exploration
- System monitoring and analytics
- Multi-platform integration management

## 🔧 Development

### Project Structure

- **Mastra Framework**: Core AI agent infrastructure
- **Cognitive Skills**: Extracted from ai-opencog project
- **Memory Processing**: Automated workflows for memory management
- **Web Interface**: Remix application in `echoself/` directory

### Testing

```bash
# Run all tests
npm run test

# Run cognitive skills tests specifically  
npm run test:skills

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Adding New Skills

1. Create skill file in `src/skills/[category]/`
2. Implement using Mastra Tool interface
3. Add to exports in `src/skills/index.ts`
4. Register in `src/mastra/index.ts`
5. Add tests in `src/skills/tests/`

## 📚 Documentation

- [`COGNITIVE_SKILLS_README.md`](./COGNITIVE_SKILLS_README.md) - Detailed cognitive capabilities
- [`WARP.md`](./WARP.md) - Development workflow and commands
- [`docs-mastra.md`](./docs-mastra.md) - Mastra framework documentation
- [`next-steps-nanocog.md`](./next-steps-nanocog.md) - Future development roadmap
- [`echoself/README.md`](./echoself/README.md) - Web interface documentation

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Requirements

- Node.js 20.9.0+
- PostgreSQL with pgvector
- Persistent storage for memory
- Environment variables configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run type checking and formatting
6. Submit a pull request

## 📄 License

ISC License - see package.json for details

## 🔗 Related Projects

- [Mastra Framework](https://mastra.ai/) - AI agent framework
- [ai-opencog](https://github.com/drzo/ai-opencog) - Source of cognitive skills
- [Inngest](https://www.inngest.com/) - Workflow scheduling platform

---

**Deep Tree Echo Mast** - Where AI meets consciousness, memory meets wisdom, and code meets cognitive evolution. 🌳✨