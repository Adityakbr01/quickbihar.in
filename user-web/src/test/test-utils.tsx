/**
 * Shared test utilities: provider-wrapped render + a location probe used to
 * assert navigation without touching component internals.
 */
import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

/** Renders the current location into the DOM for navigation assertions. */
export function LocationDisplay() {
  const location = useLocation()
  return (
    <div data-testid="location-display">
      {location.pathname}
      {location.search}
    </div>
  )
}

interface ProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  queryClient?: QueryClient
}

/**
 * Render any element (usually a <Routes> tree) inside MemoryRouter +
 * QueryClientProvider with retries disabled so failures surface fast.
 */
export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ['/'], queryClient, ...options }: ProvidersOptions = {},
) {
  const client = queryClient ?? createTestQueryClient()

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }

  return {
    queryClient: client,
    ...render(ui, { wrapper: Wrapper, ...options }),
  }
}
