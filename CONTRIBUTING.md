# 🤝 Contributing to AI Music Studio

First off, thank you for considering contributing to AI Music Studio! It's people like you that make this project great.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)
- [Architecture Guidelines](#architecture-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Git
- Supabase account (for backend testing)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-music-studio.git
   cd ai-music-studio
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy

We use a simplified Git Flow:

- `main` - Production ready code
- `develop` - Integration branch for features
- `feature/feature-name` - Feature development
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
git checkout develop
git pull origin develop
git checkout feature/your-feature-name
git rebase develop
```

## Code Style

### TypeScript Guidelines

- Use **strict TypeScript** configuration
- Prefer **interfaces** over types for object shapes
- Use **explicit return types** for functions
- Avoid `any` type - use proper typing

```typescript
// ✅ Good
interface TrackMetadata {
  title: string;
  duration: number;
  bpm?: number;
}

function processTrack(track: TrackMetadata): Promise<ProcessedTrack> {
  // implementation
}

// ❌ Bad
function processTrack(track: any): any {
  // implementation
}
```

### React Guidelines

- Use **functional components** with hooks
- Prefer **custom hooks** for complex state logic
- Use **TypeScript props interfaces**
- Implement **proper error boundaries**

```tsx
// ✅ Good
interface AudioPlayerProps {
  track: Track;
  onPlay: () => void;
  onPause: () => void;
}

function AudioPlayer({ track, onPlay, onPause }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  // component logic
}

// ❌ Bad
function AudioPlayer(props: any) {
  // component logic
}
```

### Naming Conventions

- **Components**: PascalCase (`AudioPlayer`, `TrackLibrary`)
- **Hooks**: camelCase with "use" prefix (`useAudioPlayer`, `useMusicGeneration`)
- **Files**: PascalCase for components, camelCase for utilities
- **Variables**: camelCase (`trackData`, `isPlaying`)
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_VOLUME`, `MAX_DURATION`)

### CSS/Tailwind Guidelines

- Use **semantic tokens** from design system (avoid raw colors)
- Prefer **composition** over long utility chains
- Use **responsive design** mobile-first approach
- Implement **dark/light theme** support

```tsx
// ✅ Good - Using design system
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Play Track
</button>

// ❌ Bad - Raw colors
<button className="bg-blue-500 text-white hover:bg-blue-600">
  Play Track
</button>
```

### Comment Guidelines

We use standardized comment types:

```typescript
// TODO: Implement audio visualization
// FIXME: Memory leak in audio context
// HACK: Temporary workaround for Safari audio bug
// NOTE: This function handles edge case for iOS
// REVIEW: Consider refactoring this logic
// OPTIMIZE: This could be memoized for better performance
```

## Testing

### Test Structure

```
src/
├── __tests__/          # Test files
├── components/
│   └── __tests__/      # Component tests
└── hooks/
    └── __tests__/      # Hook tests
```

### Writing Tests

```typescript
import { render, screen } from '@testing-library/react';
import { AudioPlayer } from './AudioPlayer';

describe('AudioPlayer', () => {
  it('should render play button when paused', () => {
    render(<AudioPlayer track={mockTrack} isPlaying={false} />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## Submitting Changes

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code restructuring (no functionality changes)
- `test`: Adding or updating tests
- `chore`: Build/dependency updates

**Examples:**
```bash
feat(player): add shuffle mode to audio player
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
refactor(hooks): extract common audio logic
```

### Pull Request Process

1. **Ensure your branch is up to date**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-branch
   git rebase develop
   ```

2. **Run quality checks**
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

3. **Create Pull Request**
   - Use descriptive title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Add reviewers

4. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests pass
   - [ ] Manual testing completed
   - [ ] Cross-browser testing (if UI changes)
   
   ## Screenshots
   (if applicable)
   ```

## Issue Guidelines

### Bug Reports

Use this template for bug reports:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Any other context about the problem.
```

### Feature Requests

Use this template for feature requests:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## Architecture Guidelines

### Component Architecture

Follow these principles:

1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Use composition to build complex components
3. **Props Down, Events Up**: Data flows down, events flow up
4. **Separation of Concerns**: Separate business logic from presentation

### Hook Design

```typescript
// ✅ Good - Focused hook with clear API
function useAudioPlayer() {
  const [state, setState] = useState(initialState);
  
  const actions = useMemo(() => ({
    play: () => setState(s => ({ ...s, isPlaying: true })),
    pause: () => setState(s => ({ ...s, isPlaying: false })),
  }), []);
  
  return [state, actions] as const;
}

// ❌ Bad - Monolithic hook doing too much
function useEverything() {
  // handles audio, tracks, auth, UI state, etc.
}
```

### State Management

- **Local state**: `useState` for component-specific state
- **Shared state**: Zustand stores for cross-component state
- **Server state**: React Query for API data
- **Form state**: React Hook Form for form management

### File Organization

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # Basic UI primitives
│   ├── music/         # Music-specific components
│   └── auth/          # Authentication components
├── hooks/             # Custom React hooks
├── stores/            # Zustand state stores
├── services/          # API clients and external services
├── types/             # TypeScript type definitions
├── lib/               # Utility functions
└── pages/             # Page components (routing)
```

## Performance Guidelines

### React Performance

- Use `React.memo` for expensive components
- Implement `useCallback` and `useMemo` appropriately
- Avoid inline objects/functions in JSX
- Use code splitting with `lazy` and `Suspense`

### Bundle Optimization

- Tree shake unused code
- Use dynamic imports for large dependencies
- Optimize images and assets
- Monitor bundle size with `npm run analyze`

## Accessibility Guidelines

- Use semantic HTML elements
- Implement proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios

## Security Guidelines

- Validate all user inputs
- Use prepared statements for database queries
- Implement proper authentication checks
- Follow OWASP security practices
- Regular dependency audits

## Questions?

- 💬 Join our [Discord server](https://discord.gg/ai-music-studio)
- 📧 Email us at dev@ai-music-studio.com
- 📖 Check our [documentation](https://docs.ai-music-studio.com)
- 🐛 Open an [issue](https://github.com/your-repo/ai-music-studio/issues)

Thank you for contributing! 🎵