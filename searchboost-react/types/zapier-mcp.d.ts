import 'react'

/** event.detail shape for the mcp-server-url DOM event */
export interface MCPServerUrlDetail {
  serverUrl: string
}

interface ZapierMCPAttributes
  extends React.HTMLAttributes<HTMLElement>,
    React.RefAttributes<HTMLElement> {
  'embed-id': string
  width?: string
  height?: string
  /** CSS class applied to the inner iframe */
  'class-name'?: string
  /** Quick Account Creation — all three must be supplied together */
  'sign-up-email'?: string
  'sign-up-first-name'?: string
  'sign-up-last-name'?: string
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'zapier-mcp': ZapierMCPAttributes
    }
  }
}
