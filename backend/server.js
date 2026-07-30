const allowedOrigins = [
  "https://nvsjewellery.com",
  "https://www.nvsjewellery.com",
  "http://localhost:8080",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow non-browser requests (Postman, server-to-server)
      if (!origin) return callback(null, true);

      // 2. Allow explicit origins in our list
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // 3. Allow CLIENT_URL if set in .env
      if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
        return callback(null, true);
      }

      // 4. Allow ANY Vercel Preview URL (*.vercel.app)
      if (origin.endsWith(".vercel.app")) return callback(null, true);

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.options("*", cors());