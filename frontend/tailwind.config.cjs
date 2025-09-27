const plugin = require("tailwindcss/plugin");
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [
      plugin(function({ addUtilities }) {
          addUtilities({
              '.clip-pixel-corners': {
                  'clip-path': `polygon(
            0px calc(100% - 20px),
            4px calc(100% - 20px),
            4px calc(100% - 12px),
            8px calc(100% - 12px),
            8px calc(100% - 8px),
            12px calc(100% - 8px),
            12px calc(100% - 4px),
            20px calc(100% - 4px),
            20px 100%,
            calc(100% - 20px) 100%,
            calc(100% - 20px) calc(100% - 4px),
            calc(100% - 12px) calc(100% - 4px),
            calc(100% - 12px) calc(100% - 8px),
            calc(100% - 8px) calc(100% - 8px),
            calc(100% - 8px) calc(100% - 12px),
            calc(100% - 4px) calc(100% - 12px),
            calc(100% - 4px) calc(100% - 20px),
            100% calc(100% - 20px),
            100% 20px,
            calc(100% - 4px) 20px,
            calc(100% - 4px) 12px,
            calc(100% - 8px) 12px,
            calc(100% - 8px) 8px,
            calc(100% - 12px) 8px,
            calc(100% - 12px) 4px,
            calc(100% - 20px) 4px,
            calc(100% - 20px) 0px,
            20px 0px,
            20px 4px,
            12px 4px,
            12px 8px,
            8px 8px,
            8px 12px,
            4px 12px,
            4px 20px,
            0px 20px
          )`
              }
          })
      })
  ]
};

