# Blog App File Structure (`apps/blog/`)

```
apps/blog/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   ├── error.tsx                 # Error boundary
│   ├── api/                      # API routes
│   ├── (main-and-community)/     # Route group for main feeds
│   │   ├── layout.tsx
│   │   ├── trending/
│   │   ├── hot/
│   │   ├── created/
│   │   ├── payout/
│   │   ├── muted/
│   │   └── roles/
│   ├── [param]/                  # Dynamic routes (users, communities)
│   ├── communities/              # Communities listing
│   ├── search/                   # Search page
│   ├── welcome/                  # Welcome/onboarding
│   ├── healthchecker/            # Health check endpoint
│   ├── faq.html/                 # Static FAQ page
│   ├── privacy.html/             # Privacy policy
│   ├── tos.html/                 # Terms of service
│   └── submit.html/              # Submit post form
│
├── features/                     # Feature modules (domain-driven)
│   ├── post-rendering/           # Post display components
│   │   ├── comment-list.tsx
│   │   ├── comment-list-item.tsx
│   │   ├── share-post-*.tsx
│   │   ├── user-info.tsx
│   │   ├── hooks/
│   │   └── lib/
│   ├── post-editor/              # Post creation/editing
│   ├── list-of-posts/            # Post lists/feeds
│   ├── layouts/                  # Layout components
│   ├── account-profile/          # User profile views
│   ├── account-settings/         # User settings
│   ├── account-social/           # Follow/mute functionality
│   ├── account-lists/            # Followers/following lists
│   ├── activity-log/             # User activity
│   ├── community-profile/        # Community pages
│   ├── communities-list/         # Communities browser
│   ├── search/                   # Search feature
│   ├── votes/                    # Voting UI
│   ├── mute-follow/              # Mute/follow actions
│   ├── suggestions-posts/        # Suggested posts
│   ├── tags-pages/               # Tag browsing
│   └── static-pages/             # Static content
│
├── components/                   # Shared app-level components
│   ├── hooks/                    # Custom React hooks
│   ├── base-path-link.tsx
│   ├── dialog-login.tsx
│   ├── healthcheckers-wrapper.tsx
│   └── ...
│
├── lib/                          # Utilities & helpers
│   ├── utils.ts                  # General utilities
│   ├── react-query.ts            # Query client config
│   ├── cached-api.ts             # API caching helpers
│   ├── auth-utils.ts             # Auth utilities
│   ├── get-metadata.ts           # SEO metadata
│   └── markdowns/                # Markdown utilities
│
├── store/                        # Zustand stores
│   ├── app.ts                    # Main app store
│   └── app-types.ts              # Store types
│
├── i18n/                         # i18n configuration
├── locales/                      # Translation files (en, es, fr, etc.)
├── public/                       # Static assets
├── pages/                        # Legacy pages (if any)
├── playwright/                   # E2E test support files
├── middleware.ts                 # Next.js middleware
├── next.config.js                # Next.js configuration
└── tailwind.config.js            # Tailwind (imports shared config)
```

### Conventions

1. **Route Groups**: Use `(group-name)` for logical grouping without URL impact
2. **Features**: Domain-driven modules in `features/` with co-located components, hooks, and lib
3. **Components**: Each feature has its own components; shared ones go in `components/`
4. **Hooks**: Co-locate with feature or place in `components/hooks/` if shared
5. **API Routes**: Place in `app/api/` following Next.js App Router conventions
6. **Static Pages**: Use `.html` suffix directories for static HTML pages
