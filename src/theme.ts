import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Nueva paleta personalizada - Roja
        brand: {
          50: { value: "#fef2f2" },
          100: { value: "#fde3e3" },
          200: { value: "#fbc9c9" },
          300: { value: "#f89898" },
          400: { value: "#f25f5f" },
          500: { value: "#b9030f" },  // color1 - rojo principal
          600: { value: "#9e0004" },  // color2 - rojo oscuro
          700: { value: "#70160e" },  // color3 - marrón/rojo profundo
          800: { value: "#5a1410" },
          900: { value: "#3d0e0b" },
          950: { value: "#240806" },
        },
        // Colores de acento (igual que brand para esta paleta monocromática)
        accent: {
          50: { value: "#fef2f2" },
          100: { value: "#fde3e3" },
          200: { value: "#fbc9c9" },
          300: { value: "#f89898" },
          400: { value: "#e63946" },
          500: { value: "#b9030f" },  // color1 - rojo principal
          600: { value: "#9e0004" },  // color2 - rojo oscuro
          700: { value: "#70160e" },  // color3 - marrón/rojo profundo
          800: { value: "#5a1410" },
          900: { value: "#3d0e0b" },
          950: { value: "#240806" },
        },
        // Colores de fondo y texto
        dark: {
          50: { value: "#e1e3db" },   // color5 - gris claro/crema
          100: { value: "#d4d6ce" },
          200: { value: "#b8bab2" },
          300: { value: "#8a8c84" },
          400: { value: "#5c5e56" },
          500: { value: "#3a3c35" },
          600: { value: "#2a2c26" },
          700: { value: "#1e201b" },
          800: { value: "#161917" },  // color4 - casi negro
          900: { value: "#0f110f" },
          950: { value: "#080908" },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "#ffffff" },
          fg: { value: { _light: "{colors.brand.600}", _dark: "{colors.brand.400}" } },
          muted: { value: { _light: "{colors.brand.100}", _dark: "{colors.brand.900}" } },
          subtle: { value: { _light: "{colors.brand.50}", _dark: "{colors.brand.950}" } },
          emphasized: { value: { _light: "{colors.brand.200}", _dark: "{colors.brand.700}" } },
          focusRing: { value: "{colors.brand.500}" },
        },
        accent: {
          solid: { value: "{colors.accent.500}" },
          contrast: { value: "#ffffff" },
          fg: { value: { _light: "{colors.accent.600}", _dark: "{colors.accent.400}" } },
          muted: { value: { _light: "{colors.accent.100}", _dark: "{colors.accent.900}" } },
          subtle: { value: { _light: "{colors.accent.50}", _dark: "{colors.accent.950}" } },
          emphasized: { value: { _light: "{colors.accent.200}", _dark: "{colors.accent.700}" } },
          focusRing: { value: "{colors.accent.500}" },
        },
        // Actualizar colores de fondo
        bg: {
          DEFAULT: { value: { _light: "#e1e3db", _dark: "{colors.dark.800}" } },
          muted: { value: { _light: "{colors.dark.100}", _dark: "{colors.dark.700}" } },
          subtle: { value: { _light: "#ffffff", _dark: "{colors.dark.900}" } },
          canvas: { value: { _light: "#e1e3db", _dark: "{colors.dark.800}" } },
        },
        // Colores de texto
        fg: {
          DEFAULT: { value: { _light: "{colors.dark.800}", _dark: "{colors.dark.50}" } },
          muted: { value: { _light: "{colors.dark.400}", _dark: "{colors.dark.300}" } },
        },
        // Colores de borde
        border: {
          DEFAULT: { value: { _light: "{colors.dark.200}", _dark: "{colors.dark.600}" } },
          muted: { value: { _light: "{colors.dark.100}", _dark: "{colors.dark.700}" } },
        },
      },
    },
  },
  globalCss: {
    body: {
      bg: { _light: "#e1e3db", _dark: "dark.800" },
      color: { _light: "dark.800", _dark: "dark.50" },
    },
  },
})

export const system = createSystem(defaultConfig, config)
