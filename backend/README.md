 
 
 
                    ┌─────────────┐
                    │  Fastify    │  <-- REST endpoints (HTTP)
                    │  Server     │
                    │  TypeScript │
                    └─────────────┘
                           │
          ┌────────────────┴─────────────────┐
          │                                  │
 ┌─────────────────┐                  ┌───────────────┐
 │ WebSocket Server│  <-- Real-time   │ REST Endpoints│
 │ (socket.io or   │      updates     │ (/scores,     │
 │ ws)             │                  │/players, etc.)│
 └─────────────────┘                  └───────────────┘
          │
          │
   ┌──────┴───────┐
   │ Connected    │
   │ Players      │
   └──────────────┘
