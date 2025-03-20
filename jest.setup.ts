import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for JSDOM/Next 15
if (!global.TextEncoder) {
  // @ts-ignore
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  // @ts-ignore
  global.TextDecoder = TextDecoder as any;
}

// Mock next/navigation if needed by components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock next-auth useSession by default to unauthenticated; tests will override
jest.mock('next-auth/react', () => ({
  __esModule: true,
  ...jest.requireActual('next-auth/react'),
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
}));

// Silence framer-motion animations to avoid act() warnings
jest.mock('framer-motion', () => ({
  __esModule: true,
  ...jest.requireActual('framer-motion'),
  motion: new Proxy({}, {
    get: () => (props: any) => props.children || null,
  }),
  AnimatePresence: ({ children }: any) => children,
}));
